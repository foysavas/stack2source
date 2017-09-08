const Stack = require('../stack')
const StackFrame = require('../stack-frame')

/**
 * V8 (Chrome, Android, Opera 15+, Node.js) stacks consist of a multiline error
 * message followed by a line for each frame. A frame starts with 4 spaces, the
 * word "at" and then another space. From here there are multiple formats:
 *
 * Unnamed:
 * `    at <url>:<line>:<col>`
 *
 * Named (notice how the url, line and col are wrapped in parantheses):
 * `    at <name> (<url>:<line>:<col>)`
 *
 * Supposedly IE10+ uses the same format. XXX Check needed.
 */

const DETECTOR_REGEX = /\n {4}at /

function parseStack(rawStack) {
  const stack = new Stack()
  stack.engine = 'v8'
  stack.message = ''
  stack.frames = []

  const lines = (rawStack || '').split('\n')
  let framesStarted = false
  lines.forEach(line => {
    if (!framesStarted && line.startsWith('    at ')) {
      framesStarted = true
    }
    if (framesStarted) {
      stack.frames.push(parseStackFrame(line))
    } else {
      stack.message += (stack.message === '' ? '' : '\n') + line
    }
  })

  return stack
}

function parseStackFrame(raw) {
  // TODO: Remove unused commented lines + remove group ()s from regex where not needed
  const frame = new StackFrame()
  frame.raw = raw
  const urlMatch = raw.match(/^(.+?)([^() ]+):(\d+):(\d+)(.*)$/)
  if (urlMatch) {
    const before = urlMatch[1] // TODO: Better name than `before`

    frame.parseStatus = 'ok'
    // frame.before = urlMatch[1]
    // frame.between = ''
    frame.targetUrl = frame.targetUrl = urlMatch[2]
    frame.targetLine = frame.targetLine = parseInt(urlMatch[3], 10)
    frame.targetCol = frame.targetCol = parseInt(urlMatch[4], 10)
    // frame.after = urlMatch[5]

    const nameMatch = before.match(/^(\s*at )([^ ]+)(.*)$/)
    if (nameMatch) {
      // frame.before = nameMatch[1]
      frame.targetName = nameMatch[2]
      // frame.between = nameMatch[3]
    } else {
      frame.targetName = undefined
    }
  } else {
    frame.parseStatus = 'failed'
  }
  return frame
}

module.exports = {DETECTOR_REGEX, parseStack, parseStackFrame}