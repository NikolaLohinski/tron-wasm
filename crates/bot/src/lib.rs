extern crate serde_json;

use wasm_bindgen::prelude::*;
use web_sys::console;
use std::collections::HashMap;
use wasm_bindgen::JsValue;

mod utils;

#[wasm_bindgen(module = "@/engine/RustAI.ts")]
extern "C" {
    fn act(correlation_id: &str, direction: String, depth: u32);
}

#[wasm_bindgen(start)]
pub fn start() {
    utils::init();
    console::log_1(&"[RUST]: runner module loaded".into());
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct Position {
    pub x: i32,
    pub y: i32,
    pub previous_x: i32,
    pub previous_y: i32,
}

#[wasm_bindgen]
impl Position {
    pub fn new(x: i32, y: i32, previous_x: i32, previous_y: i32) -> Position {
        Position{
            x,
            y,
            previous_x,
            previous_y,
        }
    }
}

#[wasm_bindgen]
#[derive(Debug)]
pub struct Grid {
    pub size_x: i32,
    pub size_y: i32,
    hash_map: HashMap<String, Vec<String>>,
}


#[wasm_bindgen]
impl Grid {
    pub fn key(position: &Position) -> String {
        format!("{}-{}", position.x, position.y)
    }

    pub fn new(size_x: i32, size_y: i32, json: String) -> Grid {
        match serde_json::from_str(&json) {
            Ok(filled) => Grid {
                size_x,
                size_y,
                hash_map: filled
            },
            _ => Grid {
                size_x,
                size_y,
                hash_map: HashMap::new()
            }
        }
    }

    pub fn filled(&self, position: &Position) -> bool {
        let key = Grid::key(position);
        self.hash_map.contains_key(&key)
    }
}

struct Action {
    target: Position,
    score: u32,
    depth: u32,
    movement: Option<MOVE>,
    origin: Option<MOVE>,
}

#[derive(Copy, Clone)]
enum MOVE {
    FORWARD,
    LARBOARD,
    STARBOARD,
}

struct MoveTarget {
    forward: Position,
    larboard: Position,
    starboard: Position,
}

fn to_direction(m: &MOVE) -> String {
    match m {
        MOVE::FORWARD => "FORWARD".into(),
        MOVE::LARBOARD => "LARBOARD".into(),
        MOVE::STARBOARD => "STARBOARD".into(),
    }
}

#[wasm_bindgen]
pub fn play(correlation_id: &str, position: Position, grid: &Grid, max_depth: u32) {
    let root = Action{
        target: position,
        score: 1,
        depth: 0,
        movement: None,
        origin: None,
    };
    let mut children = Vec::new();
    children.push(root);

    for _ in 0..max_depth {
        let mut new_children = Vec::new();
        for child in children {
            let newly_explored = explore(correlation_id, child, grid);
            for explored in newly_explored {
                new_children.push(explored);
            }
        }
        children = new_children;
    }
}

fn explore(correlation_id: &str, action: Action, grid: &Grid) -> Vec<Action> {
    let target = position_move_targets(&action.target);

    let mut explored = Vec::new();

    let depth = action.depth + 1;
    let score = action.score + 1;

    let starboard_origin = match &action.origin {
        Some(MOVE::FORWARD) => MOVE::FORWARD,
        Some(MOVE::LARBOARD) => MOVE::LARBOARD,
        Some(MOVE::STARBOARD) => MOVE::STARBOARD,
        None => MOVE::STARBOARD,
    };
    let starboard = Action {
        origin: Some(starboard_origin),
        score,
        depth,
        movement: Some(MOVE::STARBOARD),
        target: target.starboard,
    };
    if !is_invalid(&starboard.target, grid) {
        act(correlation_id, to_direction(&starboard_origin), depth);
        explored.push(starboard);
    }

    let larboard_origin = match &action.origin {
        Some(MOVE::FORWARD) => MOVE::FORWARD,
        Some(MOVE::LARBOARD) => MOVE::LARBOARD,
        Some(MOVE::STARBOARD) => MOVE::STARBOARD,
        None => MOVE::LARBOARD,
    };
    let larboard = Action {
        origin: Some(larboard_origin),
        score,
        depth,
        movement: Some(MOVE::LARBOARD),
        target: target.larboard,
    };
    if !is_invalid(&larboard.target, grid) {
        act(correlation_id, to_direction(&larboard_origin), depth);
        explored.push(larboard);
    }

    let forward_origin = match &action.origin {
        Some(MOVE::FORWARD) => MOVE::FORWARD,
        Some(MOVE::LARBOARD) => MOVE::LARBOARD,
        Some(MOVE::STARBOARD) => MOVE::STARBOARD,
        None => MOVE::FORWARD,
    };
    let forward = Action {
        origin: Some(forward_origin),
        score,
        depth,
        movement: Some(MOVE::FORWARD),
        target: target.forward,
    };
    if !is_invalid(&forward.target, grid) {
        act(correlation_id, to_direction(&forward_origin), depth);
        explored.push(forward);
    }

    explored
}

fn position_move_targets(position: &Position) -> MoveTarget {
    match position.x - position.previous_x {
        delta if delta != 0 => MoveTarget {
            forward: Position {
                x: position.x + delta,
                y: position.y,
                previous_x: position.x,
                previous_y: position.y
            },
            larboard: Position {
                x: position.x,
                y: position.y - delta,
                previous_x: position.x,
                previous_y: position.y
            },
            starboard: Position {
                x: position.x,
                y: position.y + delta,
                previous_x: position.x,
                previous_y: position.y
            }
        },
        _ => {
            let delta = position.y - position.previous_y;
            MoveTarget {
                forward: Position {
                    x: position.x + delta,
                    y: position.y,
                    previous_x: position.x,
                    previous_y: position.y
                },
                larboard: Position {
                    x: position.x,
                    y: position.y + delta,
                    previous_x: position.x,
                    previous_y: position.y
                },
                starboard: Position {
                    x: position.x,
                    y: position.y - delta,
                    previous_x: position.x,
                    previous_y: position.y
                }
            }
        }
    }
}

fn is_invalid(position: &Position, grid: &Grid) -> bool {
    match (position.x, position.y) {
        (x, y) if x < 0 || y < 0 || x >= grid.size_x || y >= grid.size_y => true,
        _ => grid.filled(position),
    }
}
