###############################
#                             #
# Valheim Player Editor (VPE) #
#                             #
#  Version: 1.3.5             #
#  Date: 2024-06-09           #
#  Author: Kalle Schwensen    #
#                             #
###############################


First of all, please be aware that I'm not a professional coder and only doing this in my spare time as a hobby, so please don't be mad at me if something does not work as expected.
This is just another nasty Valheim savegame editor. After investing a huge amounf of time I noticed that there are already some other savegame editors.
But well, why stop finishing it? :)


#####################
# Usage information #
#####################
I think there's nothing to say, the UI should be clear enough.
The only thing worth mentioning could be, when editing mapdata or inventory ALWAYS press the 'save slot'/'save changes' button after making your changes to an item or map.
Nearly no exception handling exists. Feel free to edit all values as you like, but please don't blame me if something will break your savegame (always do backups).
If you are using normal/real values there should be no problems.
There are some tooltips, some of them may contain useful information (hover the (i)-symbols with your cursor).


################
# Requirements #
################
.NET v4.7.2 is required, so it should work on Win7+


#################
# Compatibility #
#################
This editor is currently compatible with game version v0.217.14+. It may breaks when a new game update is released.
It may work with mods that modifies your savegame file but it is not officially supported.
Support for earlier versions has been dropped due to changes to the game mechanics.


############
# Features #
############
* edit player values
  * death/build/craft/kill count
  * skin and hair color
  * gender
  * guardian power
  * and more
* edit food
* edit skills
* edit mapdata
  * edit logout/spawn point
  * set map to explored/unexplored
  * add pins
  * edit pin names
  * change pin icons
  * delete unused maps
* edit inventory
  * 'wildcard' itemsearch
  * copy/paste items from/to clipboard (JSON format)
* drag & drop your savegame files into the editor
* savegame browser that tries to find all local and cloud saves in default locations


#############
# Thanks to #
#############
https://irongatestudio.se/ - for making possible this editor
https://zlib.net/ - for providing the compression library
https://github.com/redduxi/SHA-512 - for sharing the hashing library
https://github.com/open-source-parsers/jsoncpp - for sharing the JSON library

############
# Feedback #
############
Please provide any feedback to the Nexusmods page
https://www.nexusmods.com/valheim/mods/1536
