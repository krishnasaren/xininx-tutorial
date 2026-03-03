// src/data/topics/exinix-basics/index.js
import introduction from "./introduction.js";
import variables from "./variable.js";
import syntax from "./syntax.js";
import output from "./output.js";
import comments from "./comments.js";
import {keywords} from "./keywords.js";
import {datatypes} from "./datatypes.js";
import typecast from "./typecast.js";
import operators from "./operators.js";
import strings from "./strings.js";
import booleans from "./booleans.js";
import c_if_else   from "./controlStatement.js";
import loops from "./loops.js";
import breaks from "./breaks.js";
import arrays from "./arrays.js";
import coll from "./coll.js";
import sets from "./sets.js";
import map from "./map.js";
import pointers from "./pointers.js";


const exinixBasics = {
    id: "exinix-basics",
    title: "Exinix Basics",
    icon: "⌘",
    description: "Learn the fundamentals of Exinix programming",
    subtopics: [introduction,syntax,output,comments,keywords,datatypes, variables, typecast,operators,strings,booleans,
        pointers, c_if_else,loops,breaks,arrays,coll,sets,map]  // gathered here
};

export default exinixBasics;
