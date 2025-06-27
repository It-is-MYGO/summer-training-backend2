   // 占位文件，实际可以根据需要实现校验逻辑
   module.exports = {
     login: (req, res, next) => next(),
     register: (req, res, next) => next(),
     // 其它需要的校验函数都加上
   };