const fs = require('fs');
try {
  const content = fs.readFileSync('/Users/sunmengmeng/works/solo-coder/github0616/061608/bowling/index.html', 'utf8');
  const scriptStart = content.indexOf('<script>') + 8;
  const scriptEnd = content.indexOf('</script>', scriptStart);
  let jsCode = content.substring(scriptStart, scriptEnd);
  jsCode = jsCode.replace(/\bconst\s+BT\s*=\s*\[.*?\];/s, 'const BT = [];');
  jsCode = jsCode.replace(/\bconst\s+LC_MAP\s*=\s*\{.*?\};/s, 'const LC_MAP = {};');
  jsCode = jsCode.replace(/\bconst\s+S\s*=\s*\{.*?\};/s, 'const S = {};');
  new Function(jsCode);
  console.log('JS语法检查通过');
} catch (e) {
  console.log('JS语法错误:', e.message);
  console.log('错误行号:', e.stack.split('\n')[1]);
  process.exit(1);
}
