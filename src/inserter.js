// eslint-disable-next-line
// npx terser inserter.js --compress --safari10 --ecma 6 --mangle-props reserved=[tagz,iStream,oStream,buffers,size,decompressFile] --output ../dist/inserter.min.js
function utf8ArrayToStr(array) {
  let c;
  let char2;
  let char3;
  let i = 0;
  let out = '';
  const l = array.length;

  while (i < l) {
    c = array[i++];
    // eslint-disable-next-line default-case
    switch (c >> 4) {
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
  const raw = window.atob(base64);
  const rawLength = raw.length;
  const array = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    array[i] = raw.charCodeAt(i);
  }

  const input = new LZMA.iStream(array);
  const output = new LZMA.oStream();
  LZMA.decompressFile(input, output);

  const outputArray = output.buffers[0];
  return utf8ArrayToStr(outputArray);
}

function createTag(meta) {
  const type = meta[0] === 'j' ? 'script' : 'style';
  const lzma = meta[1];

  const str = lzma2str(lzma);

  const $tag = document.createElement(type);
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

tagz.forEach((tag) => createTag(tag));
