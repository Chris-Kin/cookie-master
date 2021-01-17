import {
    cutFirstDot,
    getSelectedTabAsync,
    getCookiesAsync,
    removeCookiesAsync,
    setCookiesAsync,
    copy,
    generateURL,
} from './shared.js';

// get cookies of current tab's domain (and its father domain)
function getCookies(list) {
    return getSelectedTabAsync(null).then(tab => {
        if (!tab) {
            return Promise.reject('can not get current tab');
        }
        return new URL(tab.url).host;
    }).then(async domain => {
        const rootDomain = domain.split('.').slice(-2).join('.');
        const childDomain = domain.split('.').slice(0, -2);
    
        const targetDomainList = [rootDomain];
    
        while(childDomain.length) {
          const dm = childDomain.pop();
          const child = [dm, targetDomainList[0]].join('.');
            targetDomainList.unshift(child);
        }

        const cookies = await getCookiesAsync({ domain: rootDomain });

        return cookies.filter(el => {
            const elWithoutPot = cutFirstDot(el.domain);
            return targetDomainList.includes(elWithoutPot);
        }).sort((a, b) => {
            return a.domain.length > b.domain.length ? -1 : 1;
        });
    }).then((cookies) => {
        list.value = cookies;
    });
}

Vue.createApp({
    setup() {
        const cookieList = Vue.ref([]);
        
        getCookies(cookieList);

        const onImport = async () => {
            const input = document.createElement('input');
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.focus();
            document.execCommand('paste');
            try {
                const cookieFromClipBoard = JSON.parse(input.value);
                if (!Array.isArray(cookieFromClipBoard)) {
                    throw Error('please paste a array');
                }
                await Promise.all(cookieFromClipBoard.map(el => {
                    return setCookiesAsync(el, true);
                }));
                getCookies(cookieList);
            } catch (err) {
                alert(err || 'data structure is bad, please check it');
            }
            document.body.removeChild(input);
        }

        const onCopy = () => {
            copy(JSON.stringify(cookieList.value));
        }

        const onPlainCopy = () => {
            const text = cookieList.value.reduce((collect, cur) => {
                return collect + `${cur.name}=${cur.value}; `;
            }, '')
            copy(text.replace(/;\s$/, ''));
        }

        const onClear = () => {
            cookieList.value.forEach(el => {
                const url = generateURL(el);
                removeCookiesAsync({ name: el.name, url });
            });
            cookieList.value = [];
        }

        const onDelete = async i => {
            const cookie = cookieList.value[i];
            const url = generateURL(cookie);
            await removeCookiesAsync({ name: cookie.name, url });
            getCookies(cookieList);
        }

        const toggleSecure = i => {
            const cookie = cookieList.value[i];
            cookie.secure = !cookie.secure;
            setCookiesAsync(cookie).finally(() => {
                getCookies(cookieList);
            });
        }

        const toggleHttpOnly = i => {
            const cookie = cookieList.value[i];
            cookie.httpOnly = !cookie.httpOnly;

            setCookiesAsync(cookie).finally(() => {
                getCookies(cookieList);
            });
        }

        return {
            cookieList,
            onImport,
            onCopy,
            onPlainCopy,
            onClear,
            onDelete,
            toggleSecure,
            toggleHttpOnly,
        }
    }
}).mount('#app');
