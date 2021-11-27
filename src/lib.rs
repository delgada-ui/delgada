#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use napi::{JsObject, Result};

mod compile;

#[module_exports]
fn init(mut exports: JsObject) -> Result<()> {
  exports.create_named_method("compile", compile::compile)?;

  Ok(())
}
