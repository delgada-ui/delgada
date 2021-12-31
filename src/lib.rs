#![deny(clippy::all)]

mod component;
mod dom;
mod js;
mod parse;

#[macro_use]
extern crate napi_derive;

use colored::*;
use component::{component_replace, get_imported_component_paths};
use dom::{create_and_insert_element, serialize_node_to_string};
use kuchiki::NodeRef;
use parse::parse;
use std::{collections::BTreeMap, fs, path::Path, str, time::Instant};

#[napi]
pub fn compile(entry_dir: String, build_dir: String) {
  println!(
    "\n{} source code starting at {}/index.html",
    "Compiling".green().bold(),
    entry_dir
  );
  let now = Instant::now();

  let (html, css, js) = build_output(entry_dir.as_str(), "index.html");

  // Create build directory (remove it first if it exists)
  let build_dir_path = Path::new(&build_dir);
  if build_dir_path.exists() {
    std::fs::remove_dir_all(build_dir_path).unwrap();
  }
  std::fs::create_dir_all(build_dir_path).unwrap();

  // Write output CSS if it exists
  if !css.is_empty() {
    let css_build_path = format!("{}/build.css", build_dir);
    fs::write(css_build_path, css).expect("Unable to write file");

    // Add link tag referencing build.css within html
    let mut attrs = BTreeMap::<&str, &str>::new();
    attrs.insert("href", "build.css");
    attrs.insert("rel", "stylesheet");
    create_and_insert_element(&html, "head", "link", attrs);
  }

  // Write output JS if it exists
  if !js.is_empty() {
    let js_build_path = format!("{}/build.js", build_dir);
    let js = js::post_process(js);
    fs::write(js_build_path, js).expect("Unable to write file");

    // Add script tag referencing build.js within html
    let mut attrs = BTreeMap::<&str, &str>::new();
    attrs.insert("src", "build.js");
    attrs.insert("type", "module");
    create_and_insert_element(&html, "head", "script", attrs);
  }

  // Write output HTML
  let html_build_path = format!("{}/build.html", build_dir);
  html.serialize_to_file(html_build_path).ok();

  let elapsed = now.elapsed();
  println!("{} build in {:.2?}\n", "Finished".green().bold(), elapsed);
}

fn build_output(entry_dir: &str, component_path: &str) -> (NodeRef, String, String) {
  let entry_path = format!("{}/{}", entry_dir, component_path);
  let mut html = parse(&Path::new(&entry_path));
  let mut css = "".to_string();
  let mut js = "".to_string();

  // Get component JavaScript
  for script_tag_match in html.select("script").unwrap() {
    let script_node = script_tag_match.as_node();
    let js_text_node = script_node.first_child().unwrap();
    js += &serialize_node_to_string(js_text_node);
    script_node.detach();
  }

  // Get component CSS
  for style_tag_match in html.select("style").unwrap() {
    let style_node = style_tag_match.as_node();
    let css_text_node = style_tag_match.as_node().first_child().unwrap();
    css += &serialize_node_to_string(css_text_node);
    style_node.detach();
  }

  // Get a list of all imported component paths
  let imported_components = get_imported_component_paths(&html);

  // Find and replace all imported component instances in the DOM tree
  for (imported_component_name, imported_component_path) in imported_components {
    // Replace the imported component element tag with the built html
    let (new_css, new_js) = component_replace(imported_component_name.as_str(), &mut html, |_| {
      // Recursively build the outputs of imported components
      let (html, css, js) = build_output(&entry_dir, &imported_component_path);
      let body_children = html.select_first("body").unwrap().as_node().children();
      let mut children_list = Vec::new();
      for child in body_children {
        children_list.push(child);
      }
      children_list.reverse();
      (Some(children_list), css, js)
    });

    css += &new_css;
    js += &new_js;
  }

  (html, css, js)
}
