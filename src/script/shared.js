const promisify = (method, ctx) => {
    return function() {
        var args = Array.prototype.slice.call(arguments, 0);
        ctx = ctx || this;
        return new Promise(function (resolve, reject) {
            var callback = function () {
                return function (result) {
                    if (result) {
                        return resolve(result);
                    }
                    return reject();
                };
            }
            args.push(callback());
            method.apply(ctx, args);
        });
    };
};

// copy text to clipboard
export function copy(value) {
    const copy = document.createElement('input');
    document.body.appendChild(copy);
    copy.value = value;
    copy.select();
    document.execCommand('copy');
    document.body.removeChild(copy);
}

// cut String's first dot, e.g. .a.com => a.com
export function cutFirstDot(str) {
    return String(str).replace(/^\./, '');
}

// generate the given cookieObj's url
export function generateURL(cookieObj) {
    const { secure, domain, path } = cookieObj;
    return  `http${secure ? 's' : ''}://${cutFirstDot(domain)}${path}`;
}

export const getSelectedTabAsync = promisify(chrome.tabs.getSelected);

export const getCookiesAsync = promisify(chrome.cookies.getAll);

export const getSingleCookieAsync = promisify(chrome.cookies.get);

export const removeCookiesAsync = promisify(chrome.cookies.remove);

export const setCookiesAsync = async function(cookie, isInCurrentDoamin) {
    const adaptedCookie = { ...cookie };

    // ignore hostOnly & session
    delete adaptedCookie.hostOnly;
    delete adaptedCookie.session;

    // must set a correct url
    adaptedCookie.url = generateURL(adaptedCookie);

    // if path exist, it must equal to current tab's path, so force to set '/'
    adaptedCookie.path = '/';

    /**
     * ensure the accuracy of domain attribute!
     * see https://github.com/electron/electron/issues/17564#issuecomment-479032055
     * If the domain-attribute is non-empty:
     *   Set the cookie's host-only-flag to false
     * Otherwise:
     *   Set the cookie's host-only-flag to true
     */
    if (!cookie.domain.startsWith('.')) {
        delete adaptedCookie.domain;
    }

    // set cookie in current active tab
    if (isInCurrentDoamin) {
        const tab = await getSelectedTabAsync(null);
        const host = new URL(tab.url).host;
        const hostWithoutPort = host.split(':')[0];
        adaptedCookie.url = `http${adaptedCookie.secure ? 's' : ''}://${hostWithoutPort}/`;

        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(hostWithoutPort) || hostWithoutPort.includes('localhost')) {
            delete adaptedCookie.domain;
        } else {
            adaptedCookie.domain = `.${host}`;
        }
    }

    return new Promise(function (res, rej) {
        chrome.cookies.set(adaptedCookie, newCookie => {
            if (!newCookie) {
                console.log('error in chrome.cookies.set:', adaptedCookie);
                return rej();
            }
            console.log('success cookie:', adaptedCookie);
            return res(newCookie);
        });
    });
}

// get cookies of current tab's domain (and its father domain)
export function getCookies() {
    return getSelectedTabAsync(null).then(tab => {
        if (!tab) {
            return Promise.reject('can not get current tab');
        }
        return new URL(tab.url).host;
    }).then(async domain => {
        // ip/localhost
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(domain) || domain.includes('localhost')) {
            const domainWithoutPort = domain.split(':')[0];
            const cookies = await getCookiesAsync({ domain: domainWithoutPort });
            // return cookies || [];
            return cookies.sort((a, b) => {
                // domain lenght first, then name first
                if (a.domain.length > b.domain.length) {
                    return -1;
                } else if (a.domain.length === b.domain.length) {
                    if (a.name > b.name) {
                        return 1;
                    } else {
                        return -1;
                    }
                } else {
                    return 1;
                }
            });
        }

        // regular domain name
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
            // domain lenght first, then name first
            if (a.domain.length > b.domain.length) {
                return -1;
            } else if (a.domain.length === b.domain.length) {
                if (a.name > b.name) {
                    return 1;
                } else {
                    return -1;
                }
            } else {
                return 1;
            }
        });
    });
}

export function Message(opt = {}) {
    const { type, text } = opt;

    const $box = document.createElement('div');
    $box.classList = 'co-msg';

    const $img = document.createElement('img');
    const imgMap = {
        success: '../asset/success.svg',
        warn: '../asset/warn.svg',
        error: '../asset/error.svg',
    }
    $img.src = imgMap[type] || '../asset/success.svg';

    const $text = document.createElement('div');

    $text.innerText = text || 'success~';

    $box.appendChild($img);
    $box.appendChild($text);

    document.body.appendChild($box);

    setTimeout(() => {
        $box.classList = 'co-msg is-leaving';
        // multi props trigger
        $box.addEventListener('transitionend', () => {
            document.body.contains($box) && document.body.removeChild($box);
        });
    }, 2000);
}

export function Loading() {
    const $mask = document.createElement('div');
    $mask.classList = 'co-loading';

    const $text = document.createElement('div');

    $mask.appendChild($text);

    document.body.appendChild($mask);

    $mask.close = () => {
        setTimeout(() => {
            document.body.contains($mask) && document.body.removeChild($mask);
        }, 300);
    }

    return $mask;
}