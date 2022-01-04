#![deny(clippy::all)]

mod component;
mod dom;
mod file;
mod js;
mod parse;

#[macro_use]
extern crate napi_derive;

use colored::*;
use component::{component_replace, get_imported_component_paths};
use dom::{create_and_insert_element, serialize_node_to_string};
use file::clear_dir;
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

  // Build delgada source code
  let full_path = format!("{}/index.html", entry_dir);
  let component_path = Path::new(&full_path);
  let (html, css, js) = build_output(&component_path.canonicalize().unwrap());

  // Clear build directory
  clear_dir(&build_dir);

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

fn build_output(component_path: &Path) -> (NodeRef, String, String) {
  let mut html = parse(&component_path);
  let mut css = "".to_string();
  let mut js = "".to_string();

  // Get component JavaScript
  for script_tag_match in html.select("script").unwrap() {
    let script_node = script_tag_match.as_node();
    let js_text_node = script_node.first_child();
    if js_text_node == None {
      continue;
    }
    js += &serialize_node_to_string(js_text_node.unwrap());
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
  let mut imported_components = Vec::<String>::new();
  let component_base_path = component_path.parent().unwrap().to_str().unwrap();
  get_imported_component_paths(&html, &mut imported_components, component_base_path);

  // Find and replace all imported component instances in the DOM tree
  for imported_component_path in imported_components {
    let component_path = Path::new(&imported_component_path);
    let component_name = component_path.file_stem().unwrap().to_str().unwrap();

    // Replace the imported component element tag with the built html
    let (component_css, component_js) = component_replace(component_name, &mut html, |_| {
      // Recursively build the outputs of imported components
      let (html, css, js) = build_output(&component_path);
      let body_children = html.select_first("body").unwrap().as_node().children();
      let mut children_list = Vec::new();
      for child in body_children {
        children_list.push(child);
      }
      children_list.reverse();
      (Some(children_list), css, js)
    });

    css += &component_css;
    js += &component_js;
  }

  (html, css, js)
}
