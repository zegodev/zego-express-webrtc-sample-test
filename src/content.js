import './assets/bootstrap.min';
import './assets/bootstrap.min.css';
import $ from 'jquery';
import i18n from 'i18next';
import { en, zh } from './assets/translation/translation';

const resources = {
    en: {
        translation: en,
    },
    zh: {
        translation: zh,
    },
};

i18n.init({
    resources,
}).then(t => {
    for (const key in en) {
        $(`.${key}`).html(i18n.t(key));
    }
});

location.search.substr(1).indexOf('lang=en') > -1 ? i18n.changeLanguage('en') : i18n.changeLanguage('zh');

export function getCgi(appId, serverUrl, cgi) {
    // 测试用代码，开发者请忽略
    // Test code, developers please ignore
    let appID = appId;
    let server = serverUrl;
    let cgiToken = cgi;
    let userID = "";
    let l3 = false;
    let isPeer = false;
    let accessDomain = '';
    let isAccess = true;
    let auth = false;
    let ver = '00';
    let sei = false;
    let seiUUID = '';
    let signal = "";
    let isDatachannel = false;
    let isSoftCoding = true;
    if (location.search) {
        const arrConfig = location.search.substr(1).split('&');

        arrConfig.forEach(function(item) {
            const key = item.split('=')[0],
                value = item.split('=')[1];

            if (key == 'appid') {
                appID = Number(value);
            }

            if (key == 'server') {
                const _server = decodeURIComponent(value);
                console.warn('server', _server);
                const _serArr = _server.split('|');
                if (_serArr.length > 1) {
                    server = _serArr;
                } else {
                    server = _server;
                }
                console.warn('server', server);
            }

            if (key == 'cgi_token') {
              cgiToken = decodeURIComponent(value);
            }

            if (key == 'user_id') {
              userID = value;
            }
            if (key == 'ver') {
                ver = value;
              }
            if (key == 'l3') {
              l3 = decodeURIComponent(value) == 'true' ? true : false;
            }
            if (key == 'auth') {
                auth = decodeURIComponent(value) == 'true' ? true : false;
            }

            if (key == 'isPeer') {
              isPeer = decodeURIComponent(value) == 'false' ? false : true;
            }

            if (key == 'access_domain') {
                const _domain = decodeURIComponent(value);
                console.warn('_domain', _domain);
                const _domArr = _domain.split('|');
                if (_domArr.length > 1) {
                    accessDomain = _domArr;
                } else {
                    accessDomain = _domArr;
                }
                console.warn('accessDomain', accessDomain);   
            }

            if (key == 'ver') {
                ver = value;
            }

            if (key == 'isAccess') {
                isAccess = decodeURIComponent(value) == 'false' ? false : true;
                console.error('isAccess', isAccess)
            }
            if (key == 'sei') {
                sei = decodeURIComponent(value) == 'true' ? true : false;
              }
            if (key == 'seiUUID') {
                seiUUID = value
            }

            if (key == "isSoftCoding") {
              isSoftCoding = decodeURIComponent(value) == "false" ? false : true;
            }
        });
    }
    return { appID, server, cgiToken, userID, l3, isPeer, accessDomain, isAccess, auth, ver, sei, seiUUID, signal, isDatachannel, isSoftCoding  };
    // 测试用代码 end
    // Test code end
}
