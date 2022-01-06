use kuchiki::{ElementData, NodeData, NodeDataRef, NodeRef};
use std::{collections::BTreeMap, path::Path};

pub fn replace_component(
  component_name: &str,
  html: &mut NodeRef,
  callback: impl Fn(&NodeRef) -> (Option<Vec<NodeRef>>, String, String),
) -> (String, String) {
  let mut css = "".to_string();
  let mut js = "".to_string();

  let replace = |node: NodeDataRef<ElementData>| -> (String, String) {
    let (new_node_list, imported_css, imported_js) = callback(node.as_node());
    for new_node in new_node_list.unwrap() {
      node.as_node().insert_after(new_node);
    }
    node.as_node().detach();
    (imported_css, imported_js)
  };

  for node in html.select(component_name).unwrap().collect::<Vec<_>>() {
    let (imported_css, imported_js) = replace(node);

    // If multiple component instances exist do not duplicate component styles
    if !css.contains(&imported_css) {
      css += &imported_css;
    }
    // If multiple component instances exist do not duplicate component logic
    if !js.contains(&imported_js) {
      js += &imported_js;
    }
  }

  (css, js)
}

pub fn get_imported_component_paths(
  html: &NodeRef,
  imported_components: &mut Vec<String>,
  component_base_path: &str,
) {
  for child in html.inclusive_descendants() {
    if let Some(comment) = child.into_comment_ref() {
      let mut comment_string = comment.as_node().to_string();

      if comment_string.contains("import") {
        comment_string = comment_string
          .strip_prefix("<!--")
          .unwrap()
          .to_string()
          .strip_suffix("-->")
          .unwrap()
          .to_string();

        let imports: Vec<&str> = comment_string.split("\n").collect();

        for import in imports {
          let mut import_string = import.to_string();

          if import_string.contains("import") {
            remove_whitespace(&mut import_string);

            import_string = import_string
              .strip_prefix("import")
              .unwrap()
              .to_string()
              .replace("'", "");

            import_string = format!("{}/{}", component_base_path, import_string);

            let imported_component_path = Path::new(&import_string).canonicalize().unwrap();
            let imported_component_path = String::from(imported_component_path.to_str().unwrap());

            imported_components.push(imported_component_path);
          }
        }
      }
      comment.as_node().detach();
    }
  }
}

fn remove_whitespace(s: &mut String) {
  s.retain(|c| !c.is_whitespace());
}

pub fn get_component_props(component: &NodeRef, props_list: &mut BTreeMap<String, String>) {
  let data = component.data().to_owned();
  match data {
    NodeData::Element(component_data) => {
      let props = component_data.attributes.borrow().to_owned().map;
      for (prop_name, prop_value) in props {
        props_list.insert(prop_name.local.to_string(), prop_value.value.to_string());
      }
    }
    NodeData::Comment(_) => println!("\ncomment\n"),
    NodeData::Doctype(_) => println!("\ndoctype\n"),
    NodeData::Document(_) => println!("\ndocument\n"),
    NodeData::DocumentFragment => println!("\ndoc fragment\n"),
    NodeData::ProcessingInstruction(_) => println!("\nprocessing instruction\n"),
    NodeData::Text(_) => println!("\ntext\n"),
  }
}

pub fn replace_props(html: &NodeRef, component_props: &BTreeMap<String, String>) {
  for child in html.inclusive_descendants() {
    if let Some(text) = child.into_text_ref() {
      let text_node = text.as_node();
      for (prop_name, prop_value) in component_props {
        let pattern = format!("{{{}}}", prop_name);
        if text.borrow().as_str().contains(&pattern) {
          let data = text_node.data().to_owned();
          match data {
            NodeData::Element(_) => println!("\nelement\n"),
            NodeData::Comment(_) => println!("\ncomment\n"),
            NodeData::Doctype(_) => println!("\ndoctype\n"),
            NodeData::Document(_) => println!("\ndocument\n"),
            NodeData::DocumentFragment => println!("\ndoc fragment\n"),
            NodeData::ProcessingInstruction(_) => println!("\nprocessing instruction\n"),
            NodeData::Text(element_text) => {
              let text = element_text.borrow().to_owned();
              let text = text.replace(&pattern, &prop_value);
              let text_parent_node = text_node.parent().unwrap();
              text_parent_node.append(NodeRef::new_text(text));
              text_node.detach();
            }
          }
        }
      }
    }
  }
}
