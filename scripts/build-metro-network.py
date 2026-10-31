# OpenStreetMap replacement is authoritative; never restore archived MINVU data.
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name('replace-metro-osm.py')),run_name='__main__')
