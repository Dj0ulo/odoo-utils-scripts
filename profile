#!/bin/bash

pid=$(ps aux | grep '[o]doo-bin' | awk '{print $2}')
sudo /home/odoo/.local/bin/py-spy record -o speedscope-$pid.json -f speedscope --pid $pid