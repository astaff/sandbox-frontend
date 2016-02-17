/**
 * core.js
 * 
 * This is the core rendering engine.  It can be used standalone on the client
 * or the server, and is designed to be combined with other modules, for 
 * example to add support for partials and helpers.
 *
 * Its main purpose is to be as small as possible while still providing a large
 * amount of functionality.
 *
 * # Usage:
 *
 * 	Logical.render('<%= message %>', {message:'Hello, world.'});
 *
 * # Precompiling Templates
 *
 * If you plan to use a template extensively, you can pre-compile and cache 
 * templates using the compile function.
 *
 * 	var tmp = Logical.compile('<%= message %>');
 * 	tmp.render({message:'Hello, world.'});
 *
 * # Collection Rendering
 *
 * If you pass an array of objects to render instead of an object, the template
 * will be rendered using each object in the array and concatenated.
 *
 * 	var item = Logical.compile("<li><%= name %></li>"),
 * 	    data = [{'name':'Tom'}, {'name':'Dick'}, {'name':'Harry'}];
 * 	
 * 	$('#myList').inject(item.compile(data));
 */
(function(scope) {

	var options = {
		// If sandbox is set to true, the code will be evaluated within an
		// isolated scope (iframe on the client and a VM on the server).
		'sandbox': true,
		// If sugar is set to true, syntax sugar will be enabled, meaning a few
		// extra regular expressions to match against while compiling things.
		'sugar': true,
		'expression_start': "<%",
		'expression_end'  : "%>"
	}, helpers = {}, templates = {};

	function config(k,v) { 
		var config = (this.logicalInstance) ? this.options : options;
		if (!v) return config[k] || options[k];
		else options[k] = v;
	}

	var sandboxEval;

	/**
	 * We can't just check to see if we're within a CommonJS module because we
	 * could be using a client-side CommonJS implementation.
	 */
	if (typeof window === "undefined") {

		/**
		 * On the server, we'll just use the built-in Node.js VM library.
		 */
		sandboxEval = function(code, locals, helpers) {

			if (!config('sandbox')) return eval(code);

			var vm = require('vm'), context = {}, k;

			// Inject local variables.
			for (k in helpers) context[k] = helpers[k];
			for (k in locals)  context[k] = locals[k];
			context['_data_'] = locals;

			return vm.runInContext(code, vm.createContext(context));

		};

	} else {

		/**
		 * The client-side sandbox environment is an iframe which dumps its
		 * data to the DOM and is then pulled before the iframe's removal.
		 */
		sandboxEval = function(code, locals, helpers) {

			if (!config('sandbox')) return eval(code);

			var iframe, iwin, k, output, error;

			// Make an iframe so we can execute code within it.
			iframe = document.createElement('iframe');
			document.body.appendChild(iframe);
			iwin = window.frames[frames.length-1];

			// Inject helpers and local variables.
			for (k in helpers) iwin[k] = helpers[k];
			for (k in locals)  iwin[k] = locals[k];
			iwin._data_ = locals;

			try {
				// Evaluate and store the output.
				output = iwin.eval(code);
			} catch(e) {
				error = e;
			}

			// Get rid of the frame we just made.
			document.body.removeChild(iframe);

			if (error) throw error;
			return output;

		};

	}

	function render(code, data, context) {

		data = data || {};
		context = context || {};

		for (var k in helpers) if (!context[k]) context[k] = helpers[k];

		if (templates[code]) {
			return templates[code].render(data, context);
		}

		// Render an array of objects and concatenate the results.
		if (data.length && typeof data=="object") {
			var output = "";
			for (var i in data) output += render(code, data[i], context);
			return output;
		}

		return sandboxEval("var _o_='';"+code+";_o_;", data, context);

	}

	function compile(code) {

		var EXP_START = config('expression_start'),
		    EXP_END   = config('expression_end'),
		    EXP_COMMENT = new RegExp('^'+EXP_START+'#'),
		    EXP_OUTPUT  = new RegExp('^'+EXP_START+'=');

		var tagMatch = new RegExp(EXP_START+'=?((.|[\r\n])*?)'+EXP_END, 'g');

		code = EXP_START+EXP_END+code;
		// Deal with text nodes.

		var c = 0;
		code = code.replace(tagMatch, function(str) {
			return '\ue001'+str+"\ue001"+(c++)+"\ue002";
		});
		code = code.replace(/\ue001\d+\ue002([^\ue001]*)/g, function(m,str) {
			return "_o_+="+JSON.stringify(str)+';';
		}).replace(/\ue001/g, '');

		code = code.replace(tagMatch, function(match, string) {

			if (match.match(EXP_COMMENT)) return '';
			if (match.match(EXP_OUTPUT)) string = '_o_+='+string+';';
			else string += '\n';

			/**
			 * The syntax sugar here is deliberately strict on what it matches;
			 * it's better to be specific about the sugar and not have to deal
			 * with the overhead of a more sophisticated tokenizer.
			 *
			 * This could be solved by offloading template compilation to the
			 * server, but this library is supposed to work as a standalone
			 * client-side library and reliably output the same data in both
			 * environments.
			 *
			 * If that's a problem, turn sugar off using config and write a 
			 * more sophisticated parser (and submit a pull request).
			 */

			if (!config('sugar')) return;

			/* Changes trailing colon to an opening brace. */
			string = string.replace(/:(\s*)$/, "{\n");
			/* Special handling of linked conditionals (no case statements) */
			string = string.replace(/\s*else(\s+if)?\s*(\((.*?)\))?\s*[^\w\s]/, "}"+string);

			/* Changes a standalone instance of the "end" keyword to a closing 
			 * brace. */
			string = string.replace(/^\s*end\s*$/, '}\n');

			/* Changes a statement of "each (foo in buzz) { }" to
			 * for (foo in buzz) { foo = buzz[foo]; }, maintaining inline var
			 * declarations as necessary. */
			var m = string.match(/\s*each\s*\((var)?\s?(\w+)\s+(in)\s+(\w+)\)/);
			if (m) {
				string  = string.replace(/^\s*each\s*/, 'for');
				string += m[2]+"="+m[4]+"["+m[2]+"];";
			}

			return string;

		});

		// Just a simple argument currying to allow this module to pass its 
		// own data to the render method.
		function renderThis(data, help) {
			return render(code, data, help);
		}

		return {
			render: renderThis,
			code: code
		};

	}

	function addHelper(name, fn) {
		((this.logicalInstance) ? this.helpers : helpers)[name] = fn;
	}

	function addTemplate(name, code) {
		var o = (this.logicalInstance) ? this.templates : templates;
		o[name] = compile(code);
		return o[name];
	}

	// Add some built-in helpers.
	addHelper('partial', function(name, data) {
		return render(name, data);
	});

	// Provide for distinct instances.

	function Instance() {
		this.helpers   = {};
		this.templates = {};
		this.options   = {};
		this.logicalInstance = true;
	}

	Instance.prototype.render = function(code, data) {
		return (this.templates[code] || compile(code)).render(data, this.helpers);	
	};

	Instance.prototype.config      = config;
	Instance.prototype.compile     = compile;
	Instance.prototype.addHelper   = addHelper;
	Instance.prototype.addTemplate = addTemplate;

	// Export all the things.

	var api = scope.api || {};

	api.render = function(code, data) {
		return (templates[code] || compile(code)).render(data, helpers);
	};

	api.instance = function() {
		return new Instance();
	};

	api.config      = config;
	api.compile     = compile;
	api.addHelper   = addHelper;
	api.addTemplate = addTemplate;
	api.debug = function() {
		return templates;
	}

	// Export with CommonJS
	if (typeof module !== 'undefined' && typeof require !== 'undefined') {
		module.exports = api;
	// Browser-based Global Plugin
	} else {
		scope.Logical = api;
	}

}(this));

/**************PRISMO********************/
(function(scope) {

/**
 * Prismo - Automatic View Composition
 *
 * This exports "Prismo", which has two methods:
 *
 *     - config(key, value)
 *
 * Current configuration settings:
 *
 *     expression_match: a regex representing the wrapper for 
 *     logical expressions.
 *
 *     comment_match: a regex representing comment blocks (which)
 *     should be ignored by the compiler.
 *
 *     template_engine: an object which has a .compile method that
 *     returns another object with a .render method.
 *
 *     template_selector: the CSS selector to find template fragments
 *     within the DOM (which will also be appended with a name 
 *     attribute.)
 *
 * The second method is createView.
 *
 *     - createView(templateName, fields)
 *
 * Fields is an object representing the required fields for the 
 * template, as well as default values or transformation methods.
 *
 * CreateView returns a View object, which has the following 
 * methods:
 * 
 *     - attach(domNode, data)
 *
 * This, in turn, creates an AttachedView object for that instance of
 * the parent View.  This has one method, set, which takes an object
 * representing desired changes to the data, or a key/value pair.
 * 
 */

	var config = {
		// These are the strings within templates we'll search for field
		// names (in order to build up dependencies).
		expression_match : /\{\{(.*?)\}\}/g,
		comment_match    : /^#/,
		// The template engine should have a .compile method which returns an
		// interface with a .render method.
		template_engine  : false,
		template_selector: 'script[type="text/logical"]'
	};

	function set_config(k,v){
		config[k] = v;
	}

	Logical.config('expression_start', "{{");
	Logical.config('expression_end', '}}');

	function View(templateName, fields) {

		// These variables get injected into the template.
		this.fields       = [];
		// Default values for fields.
		this.defaults     = {};
		// Transformation functions for field values.
		this.transforms   = {};
		// The uncompiled template in DOM form with field dependencies marked.
		// (aka: the thing that makes Prismo shiny)
		this.templateTree = [];
		// Handy list of all attached views.
		this.views        = [];

		// We take an object of disparate things, add all the keynames to
		// fields[] (for messing about with templates), all the functions to 
		// transforms, and all the normal default values to defaults.
		// (Check out the prototype declaration below for more info.)
		for (var k in fields) {
			if (fields.hasOwnProperty(k)) {
				this.fields.push(k);
				if (typeof(fields[k])==="function") {
					this.transforms[k] = fields[k];
				} else {
					this.defaults[k] = fields[k];
				}
			}
		}

		var templateString = document.querySelector(config.template_selector+'[name='+templateName+']'
		).innerHTML;

		this.templateTree = document.createElement('div');
		this.templateTree.innerHTML = templateString;
		this._walkTree(this.templateTree);

		// TODO: Check for the case in which there is no parent wrapper, in
		// which case we want to keep our arbitrary wrapper <div>.
		this.templateTree = this.templateTree.firstElementChild;

	}

	View.prototype = {

		_walkTree: function(el) {
			// Go through every child of the parent DOM node,
			// including TextContent nodes.
			var nodes = el.childNodes, node;

			for (var i=0;i<nodes.length;i++) {
				node = nodes[i];
				if (node.childNodes.length === 0) {
			 		this._compileNode(node);
				} else {
					this._walkTree(node);
				}
			}
			return el;
		},

		_getFieldNames: function(string) {

			// JavaScript doesn't support back-referencing, so let's just
			// ignore everything in between quotes.
			string = string.replace(/"(.*?)[^\\]"/g, '');   // "
			string = string.replace(/'(.*?)[^\\]'/g, '');   // '

			// idk and comments I guess.
			string = string.replace(/\/\/(.*?)$/g, '');     // <--
			string = string.replace(/\/\*((.|[\r\n])*?)\*\//gm, ''); // comments.

			// This is a comment based on the syntax sugar for comments.
			if (string.match(config.comment_match)) return;

			// Now we'll find all the words left and check them against
			// our field names.
			var words   = string.match(/\b(\w+)\b/g),
			    matches = [];

			for (var i in words) {
				// If the word is in our field list and not in our 
				// matches list, add it.
				if (
					this.fields.indexOf(words[i]) != -1 && 
					matches.indexOf(words[i]) == -1
				) {
					matches.push(words[i]);
				}
			}

			return (matches.length) ? matches : false;

		},

		_compileNode: function(node) {

			var codeBlocks = node.textContent.match(config.expression_match),
			    i, fields = [], f, n;

			if (codeBlocks) {

				// Pull out all our code blocks and determine which field
				// names we need to worry about.

				codeBlocks = node.textContent.match(config.expression_match);

				for (i in codeBlocks) {
					if (Object.prototype.hasOwnProperty.call(codeBlocks, i)) {
						f = this._getFieldNames(codeBlocks[i]);	
						if (f) {
							for (n in f) {
								if (fields.indexOf(f[n]) == -1) fields.push(f[n]);
							}
						}
					}
				}

				var par = node.parentElement, // TODO: Shim.
				    cid = (
				    	     Math.floor(Math.random()*1000) +
				    	     new Date().getTime()
				    	  ).toString(16);

				par.setAttribute('data-bind', fields.join(' '));

				// TODO: Probably a better way to store this.
				par.setAttribute('data-componentid', cid);
				Logical.addTemplate(cid, par.innerHTML);

			}

		},

		_rerender: function(el, data) {
			if (!el.getAttribute) return; // Womp womp.
			var cid = el.getAttribute('data-componentid');
			if (!cid) return; // Sad trombones.
			el.innerHTML = Logical.render(cid, data);
		},

	 	attach: function(selector) {
			var view = new AttachedView(this, selector);
			this.views.push(view);
			return view;
		}

	};

	// AttachedView is what you'll actually be dealing with most of the
	// time; it's returned from View.attach and provides the main 
	// interface for updating data.
	function AttachedView(view, selector, data) {

		this.view     = view;
		this.selector = selector;
		this.data     = data || {};

		var containers = document.body.querySelectorAll(selector),
		    clone;
		
		for (var i=0;i<containers.length;i++) {
			// Create a clone of the shadowDOM.
			clone = document.createElement('div');
			clone = this.view.templateTree.cloneNode(true);
			containers[i].innerHTML = '';
			containers[i].appendChild(clone);
		}

		return this;
	}

	AttachedView.prototype = {

		_refreshField: function(key) {
			var containers = document.body.querySelectorAll(this.selector), 
			    deps, i, j;
			for (i=0;i<containers.length;i++) {
				deps = containers[i].querySelectorAll("[data-bind*="+key+"]");
				for (j=0;j<deps.length;j++) {
					this.view._rerender(deps[j], this.data);
				}
			}
		},

		set: function(obj) {

			if (arguments.length==2) {
				var o = {};
				o[arguments[0]] = arguments[1];
				return this.set(o);
			}

			var fields = [], clone = {};	

			for (var k in obj) {
				if (obj.hasOwnProperty(k)) {
					if (this.view.transforms[k]) {
						clone = JSON.parse(JSON.stringify(this.data));
						clone.set = this.set;
						this.data[k] = this.view.transforms[k].apply(
							clone, [obj[k]]
						);
						fields.push(k);
					} else if (obj[k] != this.data[k]) {
						this.data[k] = obj[k];
						fields.push(k);
					}
				}
			}

			for(var i in fields) {
				if (fields.hasOwnProperty(i)) {
					this._refreshField(fields[i]);
				}
			}

		}

	};

	function createView(templateName, fields) {
		var newView = new View(templateName, fields);
		return newView;
	}

	scope.Prismo = {
		createView: createView,
		config: set_config
	};

}(this));