export function addCssByLink(url) {
	let doc = document;
	let link = doc.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('href', url);

	let heads = doc.getElementsByTagName('head');
	if (heads.length) heads[0].appendChild(link);
	else doc.documentElement.appendChild(link);
}

export function loadJs(url, callback) {
	let script = document.createElement('script');
	script.type = 'text/javascript';
	if (typeof callback != 'undefined') {
		if (script.readyState) {
			script.onreadystatechange = function() {
				if (script.readyState == 'loaded' || script.readyState == 'complete') {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else {
			script.onload = function() {
				callback();
			};
		}
	}
	script.src = url;
	document.body.appendChild(script);
}

export function getBrowser() {
	let ua = window.navigator.userAgent;
	let isWechat = ua.toLowerCase().match(/MicroMessenger/i) == "micromessenger";
	let isIE = window['ActiveXObject'] != undefined && ua.indexOf('MSIE') != -1;
	let isFirefox = ua.indexOf('Firefox') != -1;
	let isOpera = window['opr'] != undefined;
	let isChrome = ua.indexOf('Chrome') && window['chrome'];
	let isSafari = ua.indexOf('Safari') != -1 && ua.indexOf('Version') != -1;
	if (isWechat) {
		return 'Wechat';
	} else if (isIE) {
		return 'IE';
	} else if (isFirefox) {
		return 'Firefox';
	} else if (isOpera) {
		return 'Opera';
	} else if (isChrome) {
		return 'Chrome';
	} else if (isSafari) {
		return 'Safari';
	} else {
		return 'Unkown';
	}
}

export function IsPC() {
	return ![ 'Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod' ].some(
		(item) => navigator.userAgent.indexOf(item) > 0
	);
}

export function utf8ByteDecode (utf8Bytes) {
    let content = Utf8ArrayToStr(utf8Bytes);
    console.warn('sei content', content);
    return content;
    // if (content.indexOf('RoomKit_SEI') !== -1) {
    //     content = Base64.decode(content.replace(/RoomKit_SEI:/g, ''));
    //     return content;
    // }
};

function Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
    c = array[i++];
    switch(c >> 4)
    { 
    case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
        out += String.fromCharCode(c);
        break;
    case 12: case 13:
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
        break;
    case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
        break;
    }
    }

    return out;
}

export function encodeString(str) {
	return Uint8Array.from(
	  Array.from(unescape(encodeURIComponent(str))).map(val => val.charCodeAt(0))
	);
}
  
export function decodeString(u8arr) {
	return decodeURIComponent(escape(String.fromCharCode(...Array.from(u8arr))));
}