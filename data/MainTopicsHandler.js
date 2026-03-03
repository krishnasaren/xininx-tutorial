// src/data/topics/index.js
import exinixBasics from "./Exinix/topicsHandler.js";
import exinixMethod from "./Exinix-Method/topicsHandler.js";
import exinixoop from "./Exinix-OOP/topicsHandler.js";
import exinixFileHandling from "./Exinix-FileHandling/topicsHandler.js";
import exinixErrors from "./Exinix-Errors/topicsHandler.js";
import exinixAdvance from "./Exinix-Advance/topicsHandler.js";
import coreCompiler from "./Core-Compiler/topicsHandler.js";
const topics = [exinixBasics, exinixMethod,exinixoop,exinixErrors,exinixFileHandling,exinixAdvance,coreCompiler];

export default topics;
