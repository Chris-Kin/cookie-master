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
    // alert('复制成功');
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

export const removeCookiesAsync = promisify(chrome.cookies.remove);

export const setCookiesAsync = async function(cookie, isInCurrentDoamin) {
    const adaptedCookie = { ...cookie };

    // chrome doesn't allow set hostOnly & session
    delete adaptedCookie.hostOnly;
    delete adaptedCookie.session;

    // must set a correct url
    adaptedCookie.url = generateURL(cookie);

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
        adaptedCookie.url = `http://${host}/`;
        adaptedCookie.domain = `.${host}`;
    }

    return new Promise(function (res, rej) {
        chrome.cookies.set(adaptedCookie, newCookie => {
            if (!newCookie) {
                return rej();
            }
            return res(newCookie);
        });
    });
}
