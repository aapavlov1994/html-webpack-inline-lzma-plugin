/* eslint-disable */
// npx terser inserter.js --compress --safari10 --ecma 6 --mangle-props reserved=[tagz,iStream,oStream,decompressFile,qt] --output inserter.min.js
function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = '';
  len = array.length;
  i = 0;

  while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12: case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12)
        | ((char2 & 0x3F) << 6)
        | ((char3 & 0x3F) << 0));
        break;
    }
  }

  return out;
}

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

  var outputArray = output.qt[0];
  newOutput = Utf8ArrayToStr(outputArray);

  return newOutput;
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
/* eslint-enable */
