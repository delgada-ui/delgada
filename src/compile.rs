use napi::{CallContext, JsString, Result};

#[js_function(1)]
pub fn compile(ctx: CallContext) -> Result<JsString> {
  let entrypoint_path = ctx.get::<JsString>(0)?.into_utf8()?;
  let output = format!("Entrypoint: {}", entrypoint_path.as_str()?);

  ctx.env.create_string(output.as_str())
}
