const bpv = (obj, attr) => {
    if (!attr) {
        attr = obj;
        obj = window;
    }
    const tmp = `___${attr}`;
    obj[tmp] = obj[attr];
    Object.defineProperty(obj, attr, {
        get: () => obj[tmp],
        set: (v) => { debugger; obj[tmp] = v; }
    });
}

bpv(object, 'attributeName'); 