import {
    getCookies,
    removeCookiesAsync,
    setCookiesAsync,
    getSelectedTabAsync,
    copy,
    generateURL,
    Message,
    Loading,
} from './shared.js';

Vue.createApp({
    setup() {
        const cookieList = Vue.ref([]);
        const isAdding = Vue.ref(false);
        const cookieNameRef = Vue.ref(null);
        const addingCookie = Vue.reactive({
            name: '',
            value: '',
        });
        const canAddingCookieSubmit = Vue.computed(() => {
            return addingCookie.name && addingCookie.value;
        });

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
                let cookieFromClipBoard = [];

                // json array format
                if (/^\[\{.*\}\]$/.test(input.value)) {
                    cookieFromClipBoard = JSON.parse(input.value);
                } else {
                    debugger
                    const itemStrArray = input.value.split(/\s*;\s*/);
                    itemStrArray.forEach(item => {
                        const [name, value] = item.split('=');
                        if (name && value) {
                            cookieFromClipBoard.push({
                                name: name,
                                value: value
                            })
                        }
                    });
                }

                if (!Array.isArray(cookieFromClipBoard)) {
                    Message({ type: 'warn', text: 'please paste a cookie array' });
                    throw Error('please paste a cookie array');
                }
                await Promise.all(cookieFromClipBoard.map(el => {
                    return setCookiesAsync(el, true);
                }));
                Message({ type: 'success', text: 'data imported successfully' });
            } catch (err) {
                Message({ type: 'error', text: 'some cookie set error' });
            } finally {
                getCookies().then(c => cookieList.value = c );
                loading.close();
                document.body.removeChild(input);
            }
        }

        const onCopy = () => {
            copy(JSON.stringify(cookieList.value));
            Message({ type: 'success', text: 'cookies have been copied' });
        }

        const onSingleCopy = i => {
            copy(JSON.stringify([cookieList.value[i]]));
            Message({ type: 'success', text: 'cookie has been copied' });
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

        const onAdd = async () => {
            if (!canAddingCookieSubmit) {
                Message({ type: 'warn', text: "please input cookie's name and value" });
                return;
            }
            const tab = await getSelectedTabAsync(null);
            const host = new URL(tab.url).host;
            const hostWithoutPort = host.split(':')[0];
            const cookie = {
                name: addingCookie.name,
                value: addingCookie.value,
                domain: hostWithoutPort,
                expirationDate: new Date('2048-10-24').getTime(),
                path: '/',
            }
            setCookiesAsync(cookie, true).then(() => {
                Message({ type: 'success', text: 'success' });
                getCookies().then(c => cookieList.value = c );
                isAdding.value = false;
            }).catch(() => {
                Message({ type: 'error', text: 'failed' });
            });
        }

        Vue.watch(isAdding, (cur) => {
            if (cur === false) {
                addingCookie.name = '';
                addingCookie.value = '';
            } else {
                Vue.nextTick(() => {
                    cookieNameRef.value.focus();
                });
            }
        })

        const onDelete = async i => {
            const cookie = cookieList.value[i];
            const url = generateURL(cookie);
            await removeCookiesAsync({ name: cookie.name, url });
            getCookies().then(c => cookieList.value = c );
            Message({ type: 'success', text: `${cookie.name} has been deleted`});
        }

        const toggleSecure = async i => {
            const cookie = cookieList.value[i];

            // fixed: can not set a secure cookie to unsecure, so delete it first
            if (cookie.secure) {
                const url = generateURL(cookie);
                await removeCookiesAsync({ name: cookie.name, url });
            }

            cookie.secure = !cookie.secure;

            setCookiesAsync(cookie).then(() => {
                Message({ type: 'success', text: 'success' });
            }).catch(() => {
                Message({ type: 'error', text: 'failed' });
            }).finally(() => {
                getCookies().then(c => cookieList.value = c );
            });
        }

        const toggleHttpOnly = async i => {
            const cookie = cookieList.value[i];
            cookie.httpOnly = !cookie.httpOnly;

            setCookiesAsync(cookie).then(() => {
                Message({ type: 'success', text: 'success' });
            }).catch(() => {
                Message({ type: 'error', text: 'failed' });
            }).finally(() => {
                getCookies().then(c => cookieList.value = c );
            });
        }

        return {
            cookieNameRef,
            cookieList,
            onImport,
            onCopy,
            onFlatCopy,
            onClear,
            onDelete,
            toggleSecure,
            toggleHttpOnly,
            onSingleCopy,
            onAdd,
            isAdding,
            addingCookie,
            canAddingCookieSubmit,
        }
    }
}).mount('#app');
