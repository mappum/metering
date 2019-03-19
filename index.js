'use strict'

const babel = require('babel-core')

const SKIP = Symbol('skip')

function metering (gasIdentifier, code) {
  let plugin = function ({ types: t }) {
    return {
      visitor: {
        Expression (path, state) {
          if (SKIP in path.node) {
            // is wrapper, skip
            return
          }
          if (path.type === 'MemberExpression') {
            // skip x.y expressions
            return
          }
          if (path.parentPath != null) {
            if (SKIP in path.parentPath.node) {
              // already wrapped, skip
              return
            }
            if (path.parentPath.type === 'UpdateExpression') {
              // skip for x++ and x--
              return
            }
          }

          let call = t.callExpression(
            t.identifier(gasIdentifier),
            [ path.node ]
          )
          call[SKIP] = true

          path.replaceWith(call)
        },

        Function (path, state) {
          let call = t.callExpression(
            t.identifier(gasIdentifier),
            []
          )
          call[SKIP] = true
          path.node.body.body.unshift(call)
        }
      }
    }
  }

  let transformed = babel.transform(code, {
    plugins: [ plugin ]
  })
  return transformed.code
}

module.exports = metering
