import glob
import re

target_file_name = "gl_resources.js"
target_file = open(target_file_name, "r").read()
shader_files = {x: open(x, "r").read() for x in glob.glob("*.glsl")}

def process_includes(shader):
    for i in range(10000):
        m = re.search("#include <([^>]*)>", shader)
        if m is None:
            return shader
        dep = m.group(1) + '.glsl'
        if dep not in shader_files:
            raise RuntimeError(f"missing dependency {dep}")
        dep = shader_files[dep]
        
        shader = shader[0:m.start(0)] + dep + shader[m.end(0):]
    
    raise

target_file = process_includes(target_file)

open(f"{target_file_name}.out", "w").write(target_file)