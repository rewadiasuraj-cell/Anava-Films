const fs = require('fs');

const css = fs.readFileSync('assets/css/style.css', 'utf8');

let openBraces = 0;
let lineNum = 1;
let errors = [];

for (let i = 0; i < css.length; i++) {
  if (css[i] === '\n') lineNum++;
  if (css[i] === '{') openBraces++;
  if (css[i] === '}') {
    openBraces--;
    if (openBraces < 0) {
      errors.push(`Extra closing brace '}' at line ${lineNum}`);
      openBraces = 0;
    }
  }
}

if (openBraces > 0) {
  errors.push(`Unclosed brace '{'! Remaining open braces: ${openBraces} at end of file`);
}

console.log(`Total lines: ${lineNum}`);
if (errors.length > 0) {
  console.log('Errors found:');
  errors.forEach(e => console.log(' - ' + e));
} else {
  console.log('CSS Braces are balanced perfectly!');
}
