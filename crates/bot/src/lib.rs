use wasm_bindgen::prelude::*;
use web_sys::console;

mod utils;

#[wasm_bindgen(start)]
pub fn start() {
    utils::init();
    console::log_1(&"Rust module loaded".into());
}
