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
  for node in html.inclusive_descendants() {
    if let Some(comment) = node.into_comment_ref() {
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
  match component.data() {
    NodeData::Element(component_data) => {
      let props = component_data.attributes.borrow().to_owned().map;
      for (prop_name, prop_value) in props {
        props_list.insert(prop_name.local.to_string(), prop_value.value.to_string());
      }
    }
    NodeData::Comment(_) => (),
    NodeData::Doctype(_) => (),
    NodeData::Document(_) => (),
    NodeData::DocumentFragment => (),
    NodeData::ProcessingInstruction(_) => (),
    NodeData::Text(_) => (),
  }
}

pub fn replace_props(html: &NodeRef, component_props: &BTreeMap<String, String>) {
  for node in html.descendants().collect::<Vec<_>>() {
    for (prop_name, prop_value) in component_props {
      let pattern = format!("{{{}}}", prop_name);
      match node.data() {
        NodeData::Element(element_data) => {
          let mut attrs = element_data.attributes.borrow_mut();
          let mut attr_to_prop_mapping = BTreeMap::new();
          for (attr_name, attr_value) in attrs.to_owned().map {
            if attr_value.value.contains(&pattern) {
              attr_to_prop_mapping.insert(attr_name.local, prop_value.to_string());
            }
          }
          for (attr_name, prop_value) in attr_to_prop_mapping {
            attrs.remove(&attr_name);
            attrs.insert(&attr_name, prop_value);
          }
        }
        NodeData::Text(element_text) => {
          if element_text.borrow().contains(&pattern) {
            let new_text = element_text
              .borrow()
              .to_owned()
              .replace(&pattern, &prop_value);
            node.insert_after(NodeRef::new_text(new_text));
            node.detach();
          }
        }
        NodeData::Comment(_) => (),
        NodeData::Doctype(_) => (),
        NodeData::Document(_) => (),
        NodeData::DocumentFragment => (),
        NodeData::ProcessingInstruction(_) => (),
      }
    }
  }
}
