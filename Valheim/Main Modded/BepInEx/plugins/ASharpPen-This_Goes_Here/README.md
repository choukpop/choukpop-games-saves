# Valheim.ThisGoesHere

Small over-engineered BepInEx mod to help move files around using yaml configs.

Intended to help mod authors, by letting them supply a config file with their desired file movements.

Note, only files and paths within the BepInEx folder are valid.

ThisGoesHere scans the `BepInEx/configs` folder for any and all files named `Valheim.ThisGoesHere.yml` or with a wildcard part to add your own personal touch `Valheim.ThisGoesHere.*.yml`.

## Currently supported operations
- File
  - Copy
  - Move
  - Delete
- Folder
  - Copy
  - Copy Content
  - Move
  - Delete

## Format

All fields are optional.

```yml
PrintComment: #Text to print before running operations.
CopyFile:
- From: #Path to file that should be copied.
  To: #Path to file destination. If exists, target is overwritten.
MoveFile:
- From: #Path to file that should be moved
  To: #Path to file destination.
DeleteFile:
- #Path to file that should be deleted.
CopyFolder:
- From: #Path to folder that should be copied.
  To: #Path to folder destination. Existing files will be overwritten.
CopyFolderContent:
- From: #Path to folder that should have all its content copied.
  To: #Path to folder destination. Existing files will be overwritten.
MoveFolder:
- From: #Path to folder that should be moved.
  To: #Path to folder destination. Existing files will be overwritten.
DeleteFolder:
- #Path to folder that should be deleted.
```
Config files are run in whatever order they are found.

Operations in each config are run in the order:
1. PrintComment
2. CopyFile
3. MoveFile
4. DeleteFile
5. CopyFolder
6. CopyFolderContent
7. MoveFolder
8. DeleteFolder

## Example

```yaml
PrintComment: This text is printed when config is executed.
CopyFile:
- From: config/copy_this_file.txt
  To: plugins/folder/to_this_file.txt
MoveFile:
- From: config/move_this_file.txt
  To: config/to_this_folder/move_this_file.txt
- From: config/move_this_too.txt
  To: config/to_this_folder/move_this_too.txt
DeleteFile:
- config\remove_this.txt
- plugins/and_this.txt
CopyFolder:
- From: config/copy_this_folder/
  To: plugins/into_this/
MoveFolder:
- From: config/move_this_folder/
  To: config/into_this/
- From: config/move_this_too/
  To: plugin/
DeleteFolder:
- config\remove_this\
- plugins/and_this
```

This example will result in logs like this when starting Valheim.

```log
[Info   :   BepInEx] Loading [This Goes Here 1.0.0]
[Debug  :This Goes Here] Found 1 config files.
[Message:This Goes Here] This text is printed when config is executed.
[Message:This Goes Here] Copying 'config\copy_this_file.txt' to 'plugins\folder\to_this_file.txt'
[Info   :This Goes Here] Creating missing folders in path.
[Message:This Goes Here] Moving 'config\move_this_file.txt' to 'config\to_this_folder\move_this_file.txt'
[Info   :This Goes Here] Creating missing folders in path.
[Message:This Goes Here] Moving 'config\move_this_too.txt' to 'config\to_this_folder\move_this_too.txt'
[Message:This Goes Here] Deleting file 'config\remove_this.txt'
[Message:This Goes Here] Deleting file 'plugins\and_this.txt'
...
```

# Support

If you feel like it

<a href="https://www.buymeacoffee.com/asharppen"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a coffee&emoji=&slug=asharppen&button_colour=FFDD00&font_colour=000000&font_family=Cookie&outline_colour=000000&coffee_colour=ffffff" /></a>

# Changelog:
- v2.1.1
  - Fixed missing null-check for CopyFolderContent...
- v2.1.0
  - Added CopyFolderContent option.
- v2.0.0
  - Converted from plugin to patcher. This means it now needs to be installed in bepinex/patchers instead of bepinex/plugins. It allows This Goes Here to run before any plugins are loaded, meaning even mod dll's can now be properly targetted. Eg., mods can be deleted before they are loaded.
- v1.2.2
  - Added missing YamlDotNet, forgot to add it to the bundle. Woops.
- v1.2.1
  - Fixed CopyFolder and MoveFolder moving entire 'from'-path into 'to', instead of just the indicated 'from' folder.
- v1.2.0
  - Added folder options for move, copy, delete.
  - Fixed readme typo in filename for wild-card configs.
- v1.1.0
  - Added support for customizable file names.
- v1.0.0
  - Initial release