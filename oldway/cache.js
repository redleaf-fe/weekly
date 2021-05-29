/*
  获取到的格式：{delay: xxx, time: xxx, value: xxx}
  时间单位：毫秒
*/
let cache = {};

module.exports = {
  keys: () => Object.keys(cache),
  len: () => Object.keys(cache).length,
  has: (key) => Object.keys(cache).includes(key),
  get: (key, cb, rightNow) => {
    const oldVal = cache[key];
    if (oldVal) {
      // 立即刷新值并返回
      if (rightNow) {
        const value = typeof cb === 'function' ? cb() : undefined;
        cache[key] = {
          delay: oldVal.delay,
          time: new Date().getTime(),
          value,
        };
        return value;
      }
      // 过期时间内
      else if (new Date().getTime() - oldVal.time < oldVal.delay) {
        return oldVal.value;
      }
      // 已过期，如果传了cb，更新值，并返回；没传cb，返回undefined
      else if (typeof cb === 'function') {
        const value = cb();
        cache[key] = {
          delay: oldVal.delay,
          time: new Date().getTime(),
          value,
        };
        return value;
      }
    }
  },
  set: (key, value, delay) => {
    if (typeof key === 'string') {
      const oldVal = cache[key];
      // 已经设置过值的获取之前设置的delay
      if (oldVal) {
        cache[key] = {
          delay: delay || oldVal.delay,
          time: new Date().getTime(),
          value,
        };
      } else {
        cache[key] = {
          delay: delay || 24 * 3600 * 1000,
          time: new Date().getTime(),
          value,
        };
      }
    }
  },
  // 更新delay值
  delay: (key, delay, updateTime) => {
    if (typeof key === 'string') {
      const oldVal = cache[key];
      if (oldVal) {
        cache[key] = {
          delay: delay || oldVal.delay,
          // updateTime传真值表示需要更新time
          time: updateTime ? new Date().getTime() : oldVal.time,
          value: oldVal.value,
        };
      }
    }
  },
  del: (key) => {
    delete cache[key];
  },
  clear: () => {
    cache = null;
    cache = {};
  },
};
