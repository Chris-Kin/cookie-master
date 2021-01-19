import {
    getCookies,
    removeCookiesAsync,
    setCookiesAsync,
    copy,
    generateURL,
    Message,
    Loading,
} from './shared.js';

Vue.createApp({
    setup() {
        const cookieList = Vue.ref([]);

        getCookies().then(c => cookieList.value = c );

        const onImport = async () => {
            const loading = Loading();
            const input = document.createElement('input');
            input.style.height = '0px';
            input.style.border = 'none';
            input.style.position = 'absolute';
            document.body.appendChild(input);
            input.focus();
            document.execCommand('paste');
            try {
                const cookieFromClipBoard = JSON.parse(input.value);
                if (!Array.isArray(cookieFromClipBoard)) {
                    Message({ type: 'warn', text: 'please paste a cookie array' });
                    throw Error('please paste a cookie array');
                }
                await Promise.all(cookieFromClipBoard.map(el => {
                    return setCookiesAsync(el, true);
                }));
                Message({ type: 'success', text: 'data imported successfully' });
                getCookies().then(c => cookieList.value = c );
            } catch (err) {
                Message({ type: 'error', text: 'clipboard data structure is bad, please check it' });
            } finally {
                loading.close();
                document.body.removeChild(input);
            }
        }

        const onCopy = () => {
            copy(JSON.stringify(cookieList.value));
            Message({ type: 'success', text: 'cookies has been copied' });
        }

        const onFlatCopy = () => {
            const text = cookieList.value.reduce((collect, cur) => {
                return collect + `${cur.name}=${cur.value}; `;
            }, '')
            copy(text.replace(/;\s$/, ''));
            Message({ type: 'success', text: 'cookies has been copied in flat form' });
        }

        const onClear = () => {
            cookieList.value.forEach(el => {
                const url = generateURL(el);
                removeCookiesAsync({ name: el.name, url });
            });
            cookieList.value = [];
            Message({ type: 'success', text: `all cookies has been deleted`});
        }

        const onDelete = async i => {
            const cookie = cookieList.value[i];
            const url = generateURL(cookie);
            await removeCookiesAsync({ name: cookie.name, url });
            getCookies().then(c => cookieList.value = c );
            Message({ type: 'success', text: `${cookie.name} has been deleted`});
        }

        const toggleSecure = i => {
            const cookie = cookieList.value[i];
            cookie.secure = !cookie.secure;
            setCookiesAsync(cookie).finally(() => {
                getCookies().then(c => cookieList.value = c );
            });
        }

        const toggleHttpOnly = i => {
            const cookie = cookieList.value[i];
            cookie.httpOnly = !cookie.httpOnly;

            setCookiesAsync(cookie).finally(() => {
                getCookies().then(c => cookieList.value = c );
            });
            Message({ type: 'success', text: 'good' });
        }

        return {
            cookieList,
            onImport,
            onCopy,
            onFlatCopy,
            onClear,
            onDelete,
            toggleSecure,
            toggleHttpOnly,
        }
    }
}).mount('#app');
