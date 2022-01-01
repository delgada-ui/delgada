pub fn post_process(js: String) -> String {
  format!("window.addEventListener('load', () => {{\n{}\n}});", js)
}
