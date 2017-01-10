﻿
<!--#echo json="package.json" key="name" underline="=" -->
generic-diff-context
====================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Filter reports from `generic-diff` or compatible modules to give changes with
optional context.
<!--/#echo -->


API
---

### genDiffCtx(report[, opts])

  * `report`: the one generated by `generic-diff` or a compatible module.
  * `opts`: config object
    * `mergePairs`: (bool) (default: `false`)
      Whether pairs of deletion and addition shall be merged.
    * `unified`: (num | bool) (default: `false`)
      If not `false`, return a unified diff, i.e. array of changes,
      each change being an array of lines changed.
    * `finalLf`: (bool) (default: false; default in `unified` mode: true)
      Whether to report the trailing newline as GNU diff does:
      If the last line has a newline at its end, omit it,
      otherwise add a message that there was no newline at end of input.


### genDiffCtx(a, b[, opts])

Like above, but generate the report by `generic-diff`ing `a` and `b`.



Usage
-----

see [test/usage.demo.js](test/usage.demo.js) and [the tests](test/)



<!--#toc stop="scan" -->


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
