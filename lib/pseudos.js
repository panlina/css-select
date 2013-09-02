/*
	pseudo selectors
	
	---
	
	they are available in two forms:
	* filters called when the selector 
	  is compiled and return a function
	  that needs to return next()
	* pseudos get called on execution
	  they need to return a boolean
*/

var DomUtils    = require("domutils"),
    isTag       = DomUtils.isTag,
    getText     = DomUtils.getText,
    getParent   = DomUtils.getParent,
    getChildren = DomUtils.getChildren,
    getSiblings = DomUtils.getSiblings,
    hasAttrib   = DomUtils.hasAttrib,
    getName     = DomUtils.getName,
    getAttribute= DomUtils.getAttributeValue,
    getNCheck   = require("./nth-check.js"),
    checkAttrib = require("./attributes.js").rules.equals,
    BaseFuncs   = require("./basefunctions.js"),
    rootFunc    = BaseFuncs.rootFunc,
    trueFunc    = BaseFuncs.trueFunc,
    falseFunc   = BaseFuncs.falseFunc;

//helper methods
function getFirstElement(elems){
	for(var i = 0; elems && i < elems.length; i++){
		if(isTag(elems[i])) return elems[i];
	}
}

function getAttribFunc(name, value){
	return function(next){
		return checkAttrib(next, name, value);
	};
}

var filters = {
	contains: function(next, text){
		if(
			(text.charAt(0) === "\"" || text.charAt(0) === "'") &&
			text.charAt(0) === text.substr(-1)
		){
			text = text.slice(1, -1);
		}
		return function(elem){
			return getText(elem).indexOf(text) >= 0 && next(elem);
		};
	},
	root: function(next){
		return function(elem){
			var parent = getParent(elem);
			return !parent && next(elem);
		};
	},
	empty: function(next){
		return function(elem){
			return getChildren(elem).length === 0 && next(elem);
		};
	},
	parent: function(next){ //:parent is the inverse of :empty
		return function(elem){
			return getChildren(elem).length !== 0 && next(elem);
		};
	},

	//location specific methods
	//first- and last-child methods return as soon as they find another element
	"first-child": function(next){
		return function(elem){
			return getFirstElement(getSiblings(elem)) === elem && next(elem);
		};
	},
	"last-child": function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = siblings.length - 1; i >= 0; i--){
				if(siblings[i] === elem) return next(elem);
				if(isTag(siblings[i])) break;
			}

			return false;
		};
	},
	"first-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) return next(elem);
					if(getName(siblings[i]) === getName(elem)) break;
				}
			}

			return false;
		};
	},
	"last-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = siblings.length-1; i >= 0; i--){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) return next(elem);
					if(getName(siblings[i]) === getName(elem)) break;
				}
			}

			return false;
		};
	},
	"only-of-type": function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = 0, j = siblings.length; i < j; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) continue;
					if(getName(siblings[i]) === getName(elem)) return false;
				}
			}

			return next(elem);
		};
	},
	"only-child": function(next){
		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = 0; i < siblings.length; i++){
				if(isTag(siblings[i]) && siblings[i] !== elem) return false;
			}

			return next(elem);
		};
	},
	"nth-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			return next === rootFunc ? func : next;
		}

		return function(elem){
			var siblings = getSiblings(elem);

			for(var i = 0, pos = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-last-child": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			return next === rootFunc ? func : next;
		}

		return function(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = siblings.length - 1; i >= 0; i--){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					else pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			return next === rootFunc ? func : next;
		}

		return function(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = 0; i < siblings.length; i++){
				if(isTag(siblings[i])){
					if(siblings[i] === elem) break;
					if(getName(siblings[i]) === getName(elem)) pos++;
				}
			}

			return func(pos) && next(elem);
		};
	},
	"nth-last-of-type": function(next, rule){
		var func = getNCheck(rule);

		if(func === falseFunc) return func;
		if(func === trueFunc){
			return next === rootFunc ? func : next;
		}

		return function(elem){
			var siblings = getSiblings(elem);

			for(var pos = 0, i = siblings.length-1; i >= 0; i--){
				if(siblings[i] === elem) break;
				if(getName(siblings[i]) === getName(elem)) pos++;
			}

			return func(pos) && next(elem);
		};
	},
	
	//forms
	//to consider: :target, :enabled
	selected: function(next){
		return function(elem){
			return hasAttrib(elem, "selected") ||
				
				//the first <option> in a <select> is also selected
				//TODO this only works for direct descendents
				getName(getParent(elem)) === "option" &&
				getFirstElement(getSiblings(elem)) === elem &&
				
				next(elem);
		};
	},
	disabled: function(next){
		return function(elem){
			return hasAttrib(elem, "disabled") && next(elem);
		};
	},
	enabled: function(next){
		return function(elem){
			return !hasAttrib(elem, "disabled") && next(elem);
		};
	},
	checked: function(next){
		return function(elem){
			return hasAttrib(elem, "checked") && next(elem);
		};
	},
	
	//jQuery extensions
	header: function(next){
		return function(elem){
			var name = getName(elem);
			return (
				name === "h1" ||
				name === "h2" ||
				name === "h3" ||
				name === "h4" ||
				name === "h5" ||
				name === "h6"
			) && next(elem);
		};
	},
	button: function(next){
		return function(elem){
			return (
				getName(elem) === "button" ||
				getName(elem) === "input" &&
				hasAttrib(elem, "type") &&
				getAttribute(elem, "type") === "button"
			) && next(elem);
		};
	},
	input: function(next){
		return function(elem){
			var name = getName(elem);
			return (
				name === "input" ||
				name === "textarea" ||
				name === "select" ||
				name === "button"
			) && next(elem);
		};
	},
	text: function(next){
		return function(elem){
			return getName(elem) !== "input" && (
				!hasAttrib(elem, "type") ||
				getAttribute(elem, "type") === "text"
			) && next(elem);
		};
	},
	checkbox: getAttribFunc("type", "checkbox"),
	file: getAttribFunc("type", "file"),
	password: getAttribFunc("type", "password"),
	radio: getAttribFunc("type", "radio"),
	reset: getAttribFunc("type", "reset"),
	image: getAttribFunc("type", "image"),
	submit: getAttribFunc("type", "submit")
};

//while filters are precompiled, pseudos get called when they are needed
var pseudos = {};

module.exports = {
	compile: function(next, data){
		var name = data.name,
			subselect = data.data;

		if(typeof filters[name] === "function") return filters[name](next, subselect);
		else if(typeof pseudos[name] === "function"){
			return function(elem){
				return pseudos[name](elem, subselect) && next(elem);
			};
		} else {
			throw new SyntaxError("unmatched pseudo-class: " + name);
		}
	},
	filters: filters,
	pseudos: pseudos
};