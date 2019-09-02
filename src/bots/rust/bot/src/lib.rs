extern crate serde_json;
extern crate rand;

use rand::rngs::SmallRng;
use rand::{SeedableRng};
use rand::prelude::SliceRandom;
use wasm_bindgen::prelude::*;
use std::collections::HashMap;

mod utils;
mod position;
mod grid;

#[wasm_bindgen(module = "@/bots/rust/RustWrapper.ts")]
extern "C" {
    fn act(correlation_id: &str, direction: String, depth: i32);
}

#[wasm_bindgen(start)]
pub fn start() {
    utils::init();
}

#[derive(Copy, Clone)]
enum MOVE { FORWARD, STARBOARD, LARBOARD }

struct Context {
    pub correlation_id: String,
    pub position: position::Position,
    pub grid: grid::Grid,
    pub max_depth: i32,
    pub scores: HashMap<String, i32>,
    pub explored: HashMap<String, Node>,
}

#[derive(Copy, Clone)]
struct Node {
    pub depth: i32,
    pub direction: MOVE,
    pub origin: Option<MOVE>,
    pub position: position::Position,
}

#[wasm_bindgen]
pub fn play(correlation_id: String, position: position::Position, grid: grid::Grid, max_depth: i32) {
    let mut scores = HashMap::new();
    scores.insert(to_direction(&MOVE::FORWARD), 0);
    scores.insert(to_direction(&MOVE::STARBOARD), 0);
    scores.insert(to_direction(&MOVE::LARBOARD), 0);

    let mut ctx = Context{
        correlation_id,
        position,
        grid,
        max_depth,
        scores,
        explored: HashMap::new()
    };
    let root = Node {
        position: position.clone(),
        origin: None,
        direction: MOVE::FORWARD,
        depth: 0,
    };
    let mut nodes = Vec::new();
    nodes.push(root);

    for depth in 0..(max_depth + 1) {
        let merged_nodes = merge_children(&ctx, nodes);
        nodes = Vec::new();
        for node in merged_nodes {
            nodes.push(node.clone());
            evaluate_node(&mut ctx, node);
        }
        evaluate_context(&mut ctx, depth);
    }
}

fn evaluate_node(ctx: &mut Context, node: Node) {
    let key = format!("{}-{}", node.position.x, node.position.y);
    if ctx.explored.contains_key(&key) {
        let explored = ctx.explored.get(&key).unwrap();
        if explored.depth < node.depth {
            let previous_score = ctx.scores.get(&to_direction(&explored.direction)).unwrap();
            ctx.scores.insert(to_direction(&explored.direction), previous_score - explored.depth);

            let score = ctx.scores.get(&to_direction(&node.origin.unwrap())).unwrap();
            ctx.scores.insert(to_direction(&node.origin.unwrap()), score + node.depth);

            ctx.explored.insert(key.clone(), node);
        }
    } else {
        let score = ctx.scores.get(&to_direction(&node.origin.unwrap())).unwrap();
        ctx.scores.insert(to_direction(&node.origin.unwrap()), score + node.depth);
        ctx.explored.insert(key.clone(), node);
    }
}

fn evaluate_context(ctx: &mut Context, depth: i32) {
    let mut current_score = ctx.scores.get(&to_direction(&MOVE::FORWARD)).unwrap();
    let mut action: String = to_direction(&MOVE::FORWARD);
    for (key, value) in ctx.scores.iter() {
        if value > current_score {
            current_score = value;
            action = key.to_string();
        }
    }
    act(&ctx.correlation_id, action, depth);
}

// Returns (FORWARD, STARBOARD, LARBOARD)
fn moves(position: position::Position) -> (position::Position, position::Position, position::Position) {
    let dx = position.x - position.previous_x;
    let dy = position.y - position.previous_y;
    if dx != 0 {
        return (
            position::Position::new(
                position.x + dx,
                position.y,
                position.x,
                position.y,
            ),
            position::Position::new(
                position.x,
                position.y + dx,
                position.x,
                position.y,
            ),
            position::Position::new(
                position.x,
                position.y - dx,
                position.x,
                position.y,
            ),
        )
    } else {
        return (
            position::Position::new(
                position.x,
                position.y + dy,
                position.x,
                position.y,
            ),
            position::Position::new(
                position.x - dy,
                position.y,
                position.x,
                position.y,
            ),
            position::Position::new(
                position.x + dy,
                position.y,
                position.x,
                position.y,
            ),
        )
    }
}

fn merge_children(ctx: &Context, nodes: Vec<Node>) -> Vec<Node> {
    let mut merged = Vec::new();
    for node in nodes {
        let children = children_nodes(ctx, &node);
        for child in children {
            merged.push(child);
        }
    }

    let mut small_rng = SmallRng::from_entropy();
    merged.shuffle(&mut small_rng);

    merged
}

fn children_nodes(ctx: &Context, node: &Node) -> Vec<Node> {
    let mut nodes = Vec::new();
    let (forward, starboard, larboard) = match moves(node.position.clone()) {
        (f, s, l) => (
            new_node(f, node, MOVE::FORWARD),
            new_node(s, node, MOVE::STARBOARD),
            new_node(l, node, MOVE::LARBOARD),
        )
    };
    if !is_invalid(&forward.position, &ctx.grid) {
        nodes.push(forward);
    }
    if !is_invalid(&starboard.position, &ctx.grid) {
        nodes.push(starboard);
    }
    if !is_invalid(&larboard.position, &ctx.grid) {
        nodes.push(larboard);
    }
    nodes
}

fn new_node(position: position::Position, parent: &Node, direction: MOVE) -> Node {
    let origin = match parent.origin {
        Some(origin) => origin,
        None => direction,
    };
    Node {
        depth: parent.depth + 1,
        direction,
        position,
        origin: Some(origin),
    }
}

fn is_invalid(position: &position::Position, grid: &grid::Grid) -> bool {
    match (position.x, position.y) {
        (x, y) => x < 0 || y < 0 || x >= grid.size_x || y >= grid.size_y || grid.filled(x, y),
    }
}

fn to_direction(m: &MOVE) -> String {
    match m {
        MOVE::FORWARD => "FORWARD".into(),
        MOVE::LARBOARD => "LARBOARD".into(),
        MOVE::STARBOARD => "STARBOARD".into(),
    }
}
