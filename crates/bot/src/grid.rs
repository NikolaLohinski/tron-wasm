use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
#[derive(Debug)]
pub struct Grid {
    pub size_x: i32,
    pub size_y: i32,
    hash_map: HashMap<String, Vec<String>>,
}

#[wasm_bindgen]
impl Grid {
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

    pub fn filled(&self, x: i32, y: i32) -> bool {
        self.hash_map.contains_key(&format!("{}-{}", x, y))
    }
}
