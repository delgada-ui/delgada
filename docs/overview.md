## Documentation

The syntax and functionality of Delgada is intentionally small and concise.

It operates within the confines of standard HTML syntax and simply seeks to enable some of the hallmarks of modern frontend frameworks, such as:

- A familiar component format
- Basic data passing via component props
- An intuitive templating syntax
- A few more things

Delgada is best used for building small (mostly) static websites. You won't find any fancy diffing algorithms, virtual doms, reactive data, stateful components, or declarative syntax here. It's just plain vanilla HTML, CSS, and JavaScript that can be organized and structured in a way that is far more composable and easy to reason about.

Below is a quick overview of some of the major parts of Delgada, along with a list of future goals towards the bottom.

### Component format

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

#### File name and component name must be the same

A components name is defined/determined by its file name, so they must be the same when importing into other files.

```html
<!-- 
  import './path/to/greeting.html' // OKAY!
  import './path/to/hello.html'    // OKAY!
 -->

<greeting></greeting>   // OKAY!
<hello1234></hello1234> // NOT OKAY!
```

#### Components are always lowercase

Component names must be lowercase to match the syntax standards of vanilla HTML.

```html
<greeting></greeting> // OKAY!
<Greeting></Greeting> // NOT OKAY!
<GREETING></GREETING> // NOT OKAY!
```

#### Components always have a closing tag

Components must always have a closing tag. Self closing tags are **not** valid.

```html
<greeting></greeting> // OKAY!
<greeting />          // NOT OKAY!
<greeting>            // NOT OKAY!
```

#### Single word names or dashed names are okay

While a single word component is demonstrated above, component names with dashes are also valid.

```html
<greeting></greeting>                 // OKAY!
<my-greeting></my-greeting>           // OKAY!
<my-long-greeting></my-long-greeting> // OKAY!
```

### Component Props and Template Syntax

Very rudimentary data passing and templating syntax is also possible in Delgada.

Props take the exact same form as HTML attributes––the difference is simply in semantics, components have props, while HTML elements have attributes.

Inside your component, a prop is implicitly created by wrapping the desired prop name in curly braces and placing it directly in your markup.

```html
<h1>Hello {name}!</h1>
```

When the component is then used in another file, add the prop name and desired value to your component markup (again following the same syntax as standard HTML attributes).

```html
<!-- 
  import './hello.html'
 -->

<hello name="Universe" />
```

The resulting compiled HTML will look like: `<h1>Hello Universe!</h1>`.

### Component Logic and Styling

Components can also contain logic and styling defined inside `script` and `style` tags respectively.

At this time, logic and styling are NOT scoped to the component, meaning everything lives in the global scope and you are responsible for avoiding namespace clashes across all components and files. In the future the goal is to scope these details to each component instance.

Another notable aspect of component logic and styling is that they must be written in vanilla JavaScript and CSS to follow conventions of vanilla HTML syntax.

Below is a simple counter component example that demonstrates component logic and styling.

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
    font-family: inherit;
    font-size: 16px;
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

An important detail to know is that component logic is automatically wrapped in the following code:

```javascript
window.addEventListener('load', () => {
  // ... component logic ...
});
```

This is included so that component logic will not run until the DOM has been loaded. Without it, the above snippet of code would have to be manually included in every component script.

At this time, there is no way to opt out of this behavior but in the future there will be a `<script>` attribute implemented so component logic can be run in the global scope.

### Future Functionality, Syntax, and Tooling

Below is a list of future functionality and syntax that are being considered for Delgada.

- Rebuild the compiler using the Rust programming language
- Nested component children using the `<slot />` element
- Multiple nested component children using named slots
- Multipage website compilation (potentially using the `pages` directory convention?)
- New project creation using `npm init delgada` command
- Ship built-in dev server/file watcher?
- Ship built-in code formatter?
- Ship built-in code linter?
