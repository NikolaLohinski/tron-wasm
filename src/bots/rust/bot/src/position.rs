use wasm_bindgen::prelude::*;

#[wasm_bindgen]
#[derive(Debug)]
#[derive(Copy, Clone)]
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
