# Delgada Overview

The syntax and functionality of Delgada is intentionally small and concise.

It operates within the confines of standard HTML syntax and simply seeks to enable some of the hallmarks of modern frontend frameworks, such as:

- A familiar component format
- Basic data passing via component props
- An intuitive templating syntax
- A few more things

Delgada is best used for building small (mostly) static websites. You won't find any fancy diffing algorithms, virtual doms, reactive data, stateful components, or declarative syntax here. It's just plain vanilla HTML, CSS, and JavaScript that can be organized and structured in a way that is far more composable and easy to reason about.

Below is a quick overview of some of the major parts of Delgada, along with a list of future goals towards the bottom.

## Component format

The Delgada component format takes heavy inspiration from that of [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), and [HTMLx](https://github.com/htmlx-org/HTMLx) syntax.

Components are written in `.html` files and have a basic structure that looks like the following:

```html
<script>
  // optional component logic goes here
</script>

<!-- component markup goes here -->

<style>
  /* optional component styles go here */
</style>
```

To use a component in another `.html` file, you simply add a multiline comment at the top of the file and then use the component anywhere in your markup:

```html
<!-- 
  import './path/to/greeting.html'
 -->

<greeting></greeting>
```

Some important things to note about this are that:

### File name and component name must be the same

A components name is defined/determined by its file name, so they must be the same when importing into other files.

```html
<!-- 
  import './path/to/greeting.html' // OKAY!
  import './path/to/hello.html'    // OKAY!
 -->

<greeting></greeting>   // OKAY!
<hello1234></hello1234> // NOT OKAY!
```

### Components are always lowercase

Component names must be lowercase to match the syntax standards of vanilla HTML.

```html
<greeting></greeting> // OKAY!
<Greeting></Greeting> // NOT OKAY!
<GREETING></GREETING> // NOT OKAY!
```

### Components always have a closing tag

Components must always have a closing tag. Self closing tags are **not** valid.

```html
<greeting></greeting> // OKAY!
<greeting />          // NOT OKAY!
<greeting>            // NOT OKAY!
```

### Single word names or dashed names are okay

While a single word component is demonstrated above, component names with dashes are also valid.

```html
<greeting></greeting>                 // OKAY!
<my-greeting></my-greeting>           // OKAY!
<my-long-greeting></my-long-greeting> // OKAY!
```

## Component props and template syntax

Very rudimentary data passing and templating syntax is also possible in Delgada.

Props take the exact same form as HTML attributes, with the only difference being semantics. Components have props. HTML elements have attributes.

A prop is made up of a key and value pair, where the data contained in the value is passed into the component at compile time and rendered into final output markup.

```html
<!-- 
  import './hello.html'
 -->

<hello name="Universe"></hello>
```

Inside your component, you can access the prop by using Delgada's templating syntax. Simply wrap the prop name in curly braces and place it directly into your component markup.

```html
<h1>Hello {name}!</h1>
```

The resulting compiled HTML will look like: `<h1>Hello Universe!</h1>`.

### Notes on props and template syntax

Prop names can be both single words and dash-separated words.

```html
<hello name="Universe"></hello>       // OKAY!
<hello first-name="Universe"></hello> // OKAY!
```

Prop values can be used multiple times in a component.

```html
<h1>Hello {name}!</h1>
<p>How is your day going, {name}?</p>
```

Template syntax is only valid inside of element text and element attributes.

```html
<h1>Hello {name}!</h1>               // OKAY!
<a href="{link}">Click me!</a>       // OKAY!
<p {attr-name}="value">Some text</p> // NOT OKAY
```

## Component logic and styling

Components can also contain logic and styling, defined inside `script` and `style` tags respectively.

Currently, logic and styling are NOT scoped to the component (although it's a future goal). This means everything lives in the global scope and you are responsible for avoiding namespace clashes across all components and files.

Another notable aspect of component logic and styling is that they must be written in vanilla JavaScript and CSS to follow conventions of vanilla HTML syntax.

Below is a simple counter component that demonstrates component logic and styling.

```html
<script>
  const button = document.querySelector('button');
  button.addEventListener('click', incremementCount);

  function incremementCount() {
    const countSpan = document.getElementById('count');
    let count = parseInt(countSpan.textContent);
    countSpan.textContent = count + 1;
  }
</script>

<button>Clicked <span id="count">0</span> times</button>

<style>
  button {
    border: none;
    border-radius: 50px;
    color: white;
    background-color: rgb(67, 42, 230);
    padding: 0.75rem 1rem;
    margin: 1rem;
  }

  button:hover {
    cursor: pointer;
    background-color: rgb(53, 32, 187);
  }
</style>
```

By default, component JavaScript is automatically wrapped in a 'load' event listener so that this logic will not run until the DOM has been loaded. Without it, the snippet of code below would have to be manually included in nearly every component script.

```javascript
window.addEventListener('load', () => {
  // ... component logic ...
});
```

At this time, there is no way to opt out of this behavior but in the future there will be a `<script>` attribute implemented so component logic can be run in the global scope.

## Future functionality, syntax, and tooling

Below is a list of future functionality and syntax that are being considered for Delgada.

**Compiler syntax and functionality:**

- Component scoped CSS and JavaScript
- Global scope attributes for `<style>` and `<script>` tags
- Nested component children using the `<slot />` tag
- Multiple nested component children using named slots
- Import components via URLs
- Automaticaly parse and compile imported markdown files into HTML?
- Optional server support (i.e. wrap output compiled files in basic node server)?

**Tooling:**

- New project creation using `npm init delgada` command
- Ship built-in dev server/file watcher?
- Ship built-in code formatter?
- Ship built-in code linter?
- Ship built-in image compressor/reformatter?
