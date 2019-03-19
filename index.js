'use strict'

const babel = require('babel-core')

const SKIP = Symbol('skip')

function gasifier (gasIdentifier) {
  return function ({ types: t }) {
    return {
      visitor: {
        Expression (path, state) {
          console.log(path.node, path.node.SKIP)
          if (SKIP in path.node) {
            // is wrapper, skip
            return
          }
          if (path.parentPath && SKIP in path.parentPath.node) {
            // already wrapped, skip
            return
          }

          let call = t.callExpression(t.identifier(gasIdentifier), [])
          call[SKIP] = true

          let seq = t.sequenceExpression([
            call,
            path.node
          ])
          seq[SKIP] = true

          path.replaceWith(seq)
        }
      }
    }
  }
}



let gasified = babel.transform(`
  function foo (a, b, c) {
    for (let i = a; i < b; i += c) {
      console.log([ 1, 2, 3, i ])
    }
    return 'abc'
  }

  console.log(foo(1, 200, 3))
`, { plugins: [gasifier('consumeGas')] })
console.log(gasified.code)
// eval(gasified.code)
