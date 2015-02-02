# node-fs-diff
Difference engine for the filesystem. Basically analyses a folder and reports which files have either been added, removed or changed.

```
npm install node-fs-diff --save-dev
```

```
var fsDiff = require( 'node-fs-diff' );

var result = fsDiff( 'my_input_directory', {}, // this is the JSON manifest - empty for the first use, result.manifest should be passed in for future calls
			{
				maxRecurseDepth: 2,	// Maximum directory depth it will traverse
				fileExtensions: [ ".png" ], // file extensions filter
				skipDirectoryContentsOnAddRemove: false, // Default behaviour is when encountering a new folder, mark every file within as an added file. This changes that behaviour and only adds the directory to the change list
				forceAddAll: false // forceAddAll treat manifest as empty and mark all existing files as added
			} );
```

result.manifest - This it the JSON blob that maintains the list of files and their state. The user should not use this object directly
result.report - Contains all the changed files in the following format: 

```
files: {
	added: [], // array of files added
	modified: [], // array of files modified
	removed: [] // array of files removed
},
dirs: {
	added: [], // array of directories added
	removed: [] // array of directories removed
},
totalChanges: 0, // total number of files & directories that have been marked as changed
root: {} // JSON object that mirrors the directory structure and the state of each file / directory within.
```

