#![deny(clippy::all)]

mod component;
mod dom;
mod file;
mod js;
mod messages;
mod parse;

#[macro_use]
extern crate napi_derive;

use component::{
  get_component_props, get_imported_component_paths, replace_component, replace_props,
};
use dom::{create_and_insert_element, get_node_text};
use file::{copy_assets_to_build, create_dir, remove_dir_contents};
use glob::glob;
use kuchiki::NodeRef;
use parse::parse;
use std::{collections::BTreeMap, fs, path::Path, str, time::Instant};

#[napi]
pub fn compile(entry_dir: String, build_dir: String) {
  messages::compiling(&entry_dir);
  let now = Instant::now();

  // Build index/homepage
  let assets_path_string = format!("{}/assets", entry_dir);
  let index_path_string = format!("{}/index.html", entry_dir);
  let index_file_name = format!("index");
  let index_path = Path::new(&index_path_string);
  remove_dir_contents(&build_dir);
  copy_assets_to_build(&assets_path_string, &build_dir);
  build_page(index_path, &build_dir, &index_file_name);

  // Build pages from pages directory (if it exists)
  let pages_path_string = format!("{}/pages", entry_dir);
  let pages_path = Path::new(&pages_path_string);
  if pages_path.exists() {
    let pattern = format!("{}/**/index.html", pages_path.to_str().unwrap());
    for page_path in glob(&pattern).unwrap().collect::<Vec<_>>() {
      let page_path = page_path.unwrap();
      let build_dir = format!(
        "{}/{}",
        build_dir,
        page_path
          .to_str()
          .unwrap()
          .to_string()
          .strip_prefix("src/pages/")
          .unwrap()
          .strip_suffix("/index.html")
          .unwrap()
      );
      let build_dir_list: Vec<&str> = build_dir.split("/").collect();
      let page_file_name = build_dir_list.last().unwrap().to_string();
      let build_dir = build_dir
        .strip_suffix(&format!("/{}", &page_file_name))
        .unwrap()
        .to_string();
      let assets_path_string = format!(
        "{}/assets",
        page_path
          .to_str()
          .unwrap()
          .to_string()
          .strip_suffix("/index.html")
          .unwrap()
      );
      create_dir(&build_dir);
      copy_assets_to_build(&assets_path_string, &build_dir);
      build_page(&page_path, &build_dir, &page_file_name);
    }
  }

  messages::finished(now.elapsed());
}

fn build_page(component_path: &Path, build_dir: &String, file_name: &String) {
  let component_props = BTreeMap::<String, String>::new();
  let (html, css, js) = build_output(&component_path.canonicalize().unwrap(), &component_props);

  // Write output CSS if it exists
  if !css.is_empty() {
    let css_build_path = format!("{}/{}.css", build_dir, file_name);
    fs::write(css_build_path, css).expect("Unable to write file");

    let output_build_path = format!("./{}.css", file_name);

    // Add link tag referencing index.css within html
    let mut attrs = BTreeMap::<&str, &str>::new();
    attrs.insert("href", &output_build_path);
    attrs.insert("rel", "stylesheet");
    create_and_insert_element(&html, "head", "link", attrs);
  }

  // Write output JS if it exists
  if !js.is_empty() {
    let js_build_path = format!("{}/{}.js", build_dir, file_name);
    let js = js::post_process(js);
    fs::write(js_build_path, js).expect("Unable to write file");

    let output_build_path = format!("./{}.js", file_name);

    // Add script tag referencing index.js within html
    let mut attrs = BTreeMap::<&str, &str>::new();
    attrs.insert("src", &output_build_path);
    attrs.insert("type", "module");
    create_and_insert_element(&html, "head", "script", attrs);
  }

  // Write output HTML
  let html_build_path = format!("{}/{}.html", build_dir, file_name);
  html.serialize_to_file(html_build_path).ok();
}

fn build_output(
  component_path: &Path,
  component_props: &BTreeMap<String, String>,
) -> (NodeRef, String, String) {
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
    js += &get_node_text(js_text_node.unwrap());
    script_node.detach();
  }

  // Get component CSS
  for style_tag_match in html.select("style").unwrap() {
    let style_node = style_tag_match.as_node();
    let css_text_node = style_tag_match.as_node().first_child().unwrap();
    css += &get_node_text(css_text_node);
    style_node.detach();
  }

  // Replace prop templates with prop values
  replace_props(&html, &component_props);

  // Get a list of all imported component paths
  let mut imported_components = Vec::<String>::new();
  let component_base_path = component_path.parent().unwrap().to_str().unwrap();
  get_imported_component_paths(&html, &mut imported_components, component_base_path);

  // Find and replace all imported component instances in the DOM tree
  for imported_component_path in imported_components {
    let component_path = Path::new(&imported_component_path);
    let component_name = component_path.file_stem().unwrap().to_str().unwrap();

    // Replace the imported component element tag with the built html
    let (component_css, component_js) = replace_component(component_name, &mut html, |component| {
      // Check if component has any props
      let mut props = BTreeMap::<String, String>::new();
      get_component_props(component, &mut props);

      // Recursively build the outputs of imported components
      let (html, css, js) = build_output(&component_path, &props);
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
