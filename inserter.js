// npx terser inserter.js --compress --safari10 --ecma 6 --mangle-props reserved=[tagz,iStream,oStream,decompressFile] --output inserter.min.js
function lzma2str(base64) {
  var raw = window.atob(base64);
  var rawLength = raw.length;
  var array = new Uint8Array(new ArrayBuffer(rawLength));

  for(i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }

  var input = new LZMA.iStream(array);
  var output = new LZMA.oStream();
  LZMA.decompressFile(input, output);
  return output;
}

function createTag(meta) {
  var type = meta[0] === 'j' ? 'script' : 'style';
  var lzma = meta[1];

  var str = lzma2str(lzma);

  var $tag = document.createElement(type);
  if (type === 'style') {
    $tag.type = 'text/css';
    $tag.innerHTML = str;
    document.head.appendChild($tag);
  }
  if (type === 'script') {
    $tag.type = 'text/javascript';
    $tag.text = str;
    document.body.appendChild($tag);
  }
}

tagz.forEach(tag => createTag(tag));
