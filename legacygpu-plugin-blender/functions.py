import bpy
import mathutils
import bmesh
import shutil
import json
import struct
import os
import sys
from . import utils
from pathlib import Path
from math import pi, atan, degrees
# ----------------------------------------------------------------------------------
INFINITY = sys.float_info.max
MATERIAL_FILE_PROPS = [
  "texture",
  "secondary_texture",
  "displacement_map",
  "dissolve_map",
  "diffuse_map",
  "specular_map",
  "emissive_map",
  "normal_map",
  "env_map_right",
  "env_map_left",
  "env_map_top",
  "env_map_bottom",
  "env_map_front",
  "env_map_back",
  "toon_map",
  "thune_map"
]

# ----------------------------------------------------------------------------------
# JAM
# ----------------------------------------------------------------------------------
def jam_export(selected_obj):
  obj = {
    "Ident": "JAM",
    "NumVertices": -1,
    "NumFrames": -1,
    "NumAnimations": -1,
    "Frames": [],
    "TextureCoords": [],
    "Animations": []
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch selected object
  dg = bpy.context.evaluated_depsgraph_get()

  # Go to start frame
  bpy.context.scene.frame_current = bpy.context.scene.frame_start

  # For each frame
  while bpy.context.scene.frame_current <= bpy.context.scene.frame_end:
    # Get current mesh data
    dg.update()
    obj_eval = selected_obj.evaluated_get(dg)
    mesh = obj_eval.to_mesh()

    # Transform to correct coordinate system
    mesh.transform(bpy.context.object.matrix_world)
    mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
    mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z')) 

    vertices = []
    normals = [] 

    # Vertices, Normals
    for tri in mesh.polygons:
      if len(tri.loop_indices) != 3: raise NameError('Object not triangulate !')
      for li in tri.loop_indices:
        vert = mesh.vertices[mesh.loops[li].vertex_index]
        for i in range(0, 3):
          vertices.append(round(vert.co[i], 4))
          normals.append(round(vert.normal[i], 4))
        #endfor
      #endfor
    #endfor

    # Append to obj
    obj["Frames"].append({"Vertices": vertices, "Normals": normals})
    bpy.context.scene.frame_current += 1
  #endwhile

  depsgraph = bpy.context.evaluated_depsgraph_get()
  depsgraph.update()
  obj_eval = selected_obj.evaluated_get(depsgraph)
  mesh = obj_eval.data

  # TextureCoords
  for tri in mesh.polygons:
    for li in tri.loop_indices:
      obj["TextureCoords"].append(round(mesh.uv_layers.active.data[li].uv[0], 4))
      obj["TextureCoords"].append(1 - round(mesh.uv_layers.active.data[li].uv[1], 4))
    #endfor
  #endfor

  # Animations
  for anim in selected_obj.jam_animations:
    obj["Animations"].append({ "Name": anim.name, "StartFrame": anim.start_frame, "EndFrame": anim.end_frame, "FrameDuration": anim.frame_duration })
  #endfor

  obj["NumVertices"] = int(len(obj["Frames"][0]["Vertices"]) / 3)
  obj["NumFrames"] = len(obj["Frames"])
  obj["NumAnimations"] = len(obj["Animations"])

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)
  return obj


def jam_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jam')
  data = jam_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jam_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'bam')
  data = jam_export(selected_obj)

  with open(file, "wb") as f:
    header = struct.pack('<3i', data["NumVertices"], data["NumFrames"], data["NumAnimations"])
    f.write(header)

    for uv in data["TextureCoords"]:
      buf = struct.pack('<f', uv)
      f.write(buf)
    #endfor

    for frame in data["Frames"]:
      for vert in frame["Vertices"]:
        buf = struct.pack('<f', vert)
        f.write(buf)
      #endfor

      for norm in frame["Normals"]:
        buf = struct.pack('<f', norm)
        f.write(buf)
      #endfor
    #endfor

    for animation in data["Animations"]:
      namelen = struct.pack('<i', len(animation["Name"]))
      f.write(namelen)

      for char in animation["Name"]:
        c = struct.pack('<i', ord(char))
        f.write(c)
      #endfor

      buf = struct.pack('<3i', animation["StartFrame"], animation["EndFrame"], animation["FrameDuration"])
      f.write(buf)
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JWM
# ----------------------------------------------------------------------------------
def jwm_export(selected_obj):
  obj = {
    "Ident": "JWM",
    "NumSectors": -1,
    "NumSectorColors": -1,
    "Min": [],
    "Max": [],
    "Sectors": [],
    "SectorColors": [],
    "NeighborPool": [],
    "SharedPool": []
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch selected object
  dg = bpy.context.evaluated_depsgraph_get()

  # Get current mesh data
  dg.update()
  obj_eval = selected_obj.evaluated_get(dg)
  mesh = obj_eval.to_mesh()

  # Transform to correct coordinate system
  mesh.transform(bpy.context.object.matrix_world)
  mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
  mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z')) 

  # Minimum and maximum base
  minimum = [INFINITY, INFINITY, INFINITY]
  maximum = [-INFINITY, -INFINITY, -INFINITY]

  # Sectors, SectorColors
  for tri in mesh.polygons:
    if len(tri.loop_indices) != 3: raise NameError('Object not triangulate !')
    sec = []
    col = []

    for li in tri.loop_indices:
      secVertex = []
      secVertexColor = []

      if (len(mesh.vertex_colors) > 0):
        for i in range(0, 3):
          secVertexColor.append(mesh.vertex_colors[0].data[li].color[i])
        #endfor
      #endif

      vert = mesh.vertices[mesh.loops[li].vertex_index]
      for i in range(0, 3):
        v = round(vert.co[i], 4)
        minimum[i] = min(v, minimum[i])
        maximum[i] = max(v, maximum[i])
        secVertex.append(v)
      #endfor

      if (len(secVertex) > 0): sec.append(secVertex)
      if (len(secVertexColor) > 0): col.append(secVertexColor)
    #endfor

    if (len(sec) > 0): obj["Sectors"].append(sec)
    if (len(col) > 0): obj["SectorColors"].append(col[0] if (col[0] == col[1] and col[0] == col[2]) else [0.0, 0.0, 0.0])
  #endfor

  # NeighborPool, SharedPool
  for i in range(len(obj["Sectors"])):
    neighbors = [-1, -1, -1]
    shared = [i]

    for j in range(3):
      p1 = obj["Sectors"][i][j]
      p2 = obj["Sectors"][i][(j + 1) % 3]

      for k in range(len(obj["Sectors"])):
        if obj["Sectors"][k] == obj["Sectors"][i]: continue
        for l in range(3):
          p1prime = obj["Sectors"][k][l]
          p2prime = obj["Sectors"][k][(l + 1) % 3]
          neighbor_test1 = p1 == p1prime and p2 == p2prime
          neighbor_test2 = p1 == p2prime and p2 == p1prime
          if neighbor_test1 or neighbor_test2: neighbors[j] = k
          if p1 == p1prime and not k in shared: shared.append(k)
        #endfor
      #endfor
    #endfor

    obj["NeighborPool"].append(neighbors)
    obj["SharedPool"].append(shared)
  #endfor

  # NumSectors, NumSectorColors, Min, Max
  obj["NumSectors"] = len(obj["Sectors"]);
  obj["NumSectorColors"] = len(obj["SectorColors"])
  obj["Min"] = [minimum[0], minimum[2]]
  obj["Max"] = [maximum[0], maximum[2]]

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)

  return obj


def jwm_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jwm')
  data = jwm_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jwm_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'bwm')
  data = jwm_export(selected_obj)

  with open(file, "wb") as f:
    header = struct.pack('<2f', data["NumSectors"], data["NumSectorColors"])
    f.write(header)

    min = struct.pack('<2f', data["Min"][0], data["Min"][1])
    f.write(min)

    max = struct.pack('<2f', data["Max"][0], data["Max"][1])
    f.write(max)

    for sec in data["Sectors"]:
      for i in range(0, 3):
        buf = struct.pack('<3f', sec[i][0], sec[i][1], sec[i][2])
        f.write(buf)
      #endfor
    #endfor

    for col in data["SectorColors"]:
      buf = struct.pack('<3f', col[0], col[1], col[2])
      f.write(buf)
    #endfor

    for neighbor in data["NeighborPool"]:
      buf = struct.pack('<3f', neighbor[0], neighbor[1], neighbor[2])
      f.write(buf)
    #endfor

    for shared in data["SharedPool"]:
      buf = struct.pack('<f', len(shared))
      f.write(buf);
      for index in shared:
        buf = struct.pack('<f', index)
        f.write(buf)
      #endfor
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JNM
# ----------------------------------------------------------------------------------
def jnm_export(selected_obj):
  obj = {
    "Ident": "JNM",
    "NumFrags": -1,
    "NumFragColors": -1,
    "Min": [],
    "Max": [],
    "Frags": [],
    "FragColors": []
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch selected object
  dg = bpy.context.evaluated_depsgraph_get()

  # Get current mesh data
  dg.update()
  obj_eval = selected_obj.evaluated_get(dg)
  mesh = obj_eval.to_mesh()

  # Transform to correct coordinate system
  mesh.transform(bpy.context.object.matrix_world)
  mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
  mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z')) 

  # Minimum and maximum base
  minimum = [INFINITY, INFINITY, INFINITY]
  maximum = [-INFINITY, -INFINITY, -INFINITY]

  # Frags, FragColors
  for tri in mesh.polygons:
    if len(tri.loop_indices) != 3: raise NameError('Object not triangulate !')
    frag = []
    fcol = []

    for li in tri.loop_indices:
      fragVertex = []
      fragVertexColor = []

      if (len(mesh.vertex_colors) > 0):
        for i in range(0, 3):
          fragVertexColor.append(mesh.vertex_colors[0].data[li].color[i])
        #endfor
      #endif

      vert = mesh.vertices[mesh.loops[li].vertex_index]
      for i in range(0, 3):
        v = round(vert.co[i], 4)
        minimum[i] = min(v, minimum[i])
        maximum[i] = max(v, maximum[i])
        fragVertex.append(v)
      #endfor

      if (len(fragVertex) > 0): frag.append(fragVertex)
      if (len(fragVertexColor) > 0): fcol.append(fragVertexColor)
    #endfor

    if (len(frag) > 0): obj["Frags"].append(frag)
    if (len(fcol) > 0): obj["FragColors"].append(fcol[0] if (fcol[0] == fcol[1] and fcol[0] == fcol[2]) else [0.0, 0.0, 0.0])
  #endfor

  # NumFrags, NumFragColors, Min, Max
  obj["NumFrags"] = len(obj["Frags"])
  obj["NumFragColors"] = len(obj["FragColors"])
  obj["Min"] = minimum
  obj["Max"] = maximum

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)

  return obj


def jnm_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jnm')
  data = jnm_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jnm_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'bnm')
  data = jnm_export(selected_obj)

  with open(file, "wb") as f:
    header = struct.pack('<2f', data["NumFrags"], data["NumFragColors"])
    f.write(header)

    min = struct.pack('<3f', data["Min"][0], data["Min"][1], data["Min"][2])
    f.write(min)

    max = struct.pack('<3f', data["Max"][0], data["Max"][1], data["Max"][2])
    f.write(max)

    for frag in data["Frags"]:
      for i in range(0, 3):
        buf = struct.pack('<3f', frag[i][0], frag[i][1], frag[i][2])
        f.write(buf)
      #endfor
    #endfor

    for col in data["FragColors"]:
      buf = struct.pack('<3f', col[0], col[1], col[2])
      f.write(buf)
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JSM
# ----------------------------------------------------------------------------------
def jsm_export(selected_obj):
  obj = {
    "Ident": "JSM",
    "NumVertices": -1,
    "Vertices": [],
    "Colors": [],
    "Normals": [],
    "TextureCoords": []
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch selected object
  dg = bpy.context.evaluated_depsgraph_get()

  # Get current mesh data
  dg.update()
  obj_eval = selected_obj.evaluated_get(dg)
  mesh = obj_eval.to_mesh()

  # Transform to correct coordinate system
  mesh.transform(bpy.context.object.matrix_world)
  mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
  mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z')) 

  # Vertices, Normals, Colors
  for tri in mesh.polygons:
    if len(tri.loop_indices) != 3: raise NameError('Object not triangulate !')
    for li in tri.loop_indices:
      if (len(mesh.vertex_colors) > 0):
        color = mesh.vertex_colors[0].data[li].color
        for i in range(0, 3):
          obj["Colors"].append(round(color[i], 4))
        #endfor
      #endif

      vert = mesh.vertices[mesh.loops[li].vertex_index]
      for i in range(0, 3):
        obj["Vertices"].append(round(vert.co[i], 4))
        obj["Normals"].append(round(vert.normal[i], 4))
      #endfor
    #endfor
  #endfor

  # TextureCoords
  for tri in mesh.polygons:
    for li in tri.loop_indices:
      obj["TextureCoords"].append(round(mesh.uv_layers.active.data[li].uv[0], 4))
      obj["TextureCoords"].append(1 - round(mesh.uv_layers.active.data[li].uv[1], 4))
    #endfor
  #endfor

  # NumVertices, NumTextureCoords, NumNormals, NumColors
  obj["NumVertices"] = int(len(obj["Vertices"]) / 3)
  obj["NumTextureCoords"] = int(len(obj["TextureCoords"]) / 2)
  obj["NumNormals"] = int(len(obj["Normals"]) / 3)
  obj["NumColors"] = int(len(obj["Colors"]) / 3)

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)

  return obj


def jsm_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jsm')
  data = jsm_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jsm_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'bsm')
  data = jsm_export(selected_obj)

  with open(file, "wb") as f:
    header = struct.pack('<4i', data["NumVertices"], data["NumTextureCoords"], data["NumNormals"], data["NumColors"])
    f.write(header)

    for vert in data["Vertices"]:
      buf = struct.pack('<f', vert)
      f.write(buf)
    #endfor

    for uv in data["TextureCoords"]:
      buf = struct.pack('<f', uv)
      f.write(buf)
    #endfor

    for normal in data["Normals"]:
      buf = struct.pack('<f', normal)
      f.write(buf)
    #endfor

    for color in data["Colors"]:
      buf = struct.pack('<f', color)
      f.write(buf)
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JLM
# ----------------------------------------------------------------------------------
def jlm_export(selected_obj):
  obj = {
    "Ident": "JLM",
    "NumPoints": -1,
    "Points": []
  }

  mw = selected_obj.matrix_world.copy()
  rot_x = mathutils.Matrix.Rotation(pi/2, 4, 'X')
  rot_z = mathutils.Matrix.Rotation(pi, 4, 'Z')
  transform = mw @ rot_x @ rot_z

  if selected_obj.type == 'CURVE':
    for spline in selected_obj.data.splines:
      for p in spline.points:
        co = mathutils.Vector((p.co.x, p.co.y, p.co.z))
        co_world = transform @ co
        obj["Points"].append([
          co_world.x,
          co_world.y,
          co_world.z
        ])
      #endfor
    #endfor
  elif selected_obj.type == 'MESH':
    dg = bpy.context.evaluated_depsgraph_get()
    dg.update()
    obj_eval = selected_obj.evaluated_get(dg)
    mesh = obj_eval.to_mesh()

    # Transform to correct coordinate system
    mesh.transform(bpy.context.object.matrix_world)
    mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
    mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z')) 

    for vertex in mesh.vertices:
      obj["Points"].append([
        vertex.co.x,
        vertex.co.y,
        vertex.co.z
      ])
    #endfor
  # endif

  obj["NumPoints"] = len(obj["Points"])
  return obj


def jlm_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jlm')
  data = jlm_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jlm_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'blm')
  data = jlm_export(selected_obj)

  with open(file, "wb") as f:
    for vert in data["Points"]:
      buf = struct.pack('<3f', vert[0], vert[1], vert[2])
      f.write(buf)
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JSV
# ----------------------------------------------------------------------------------
def jsv_export(selected_obj):
  obj = {
    "Ident": "JSV",
    "NumVertices": -1,
    "Vertices": [],
    "Colors": []
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch selected object
  dg = bpy.context.evaluated_depsgraph_get()

  # Get current mesh data
  dg.update()
  obj_eval = selected_obj.evaluated_get(dg)
  mesh = obj_eval.to_mesh()

  # Transform to correct coordinate system
  mesh.transform(bpy.context.object.matrix_world)
  mesh.transform(mathutils.Matrix.Rotation(pi/2, 4, 'X')) 
  mesh.transform(mathutils.Matrix.Rotation(pi, 4, 'Z'))

  # Vertices, Colors
  for tri in mesh.polygons:
    if len(tri.loop_indices) != 3: raise NameError('Object not triangulate !')
    for li in tri.loop_indices:
      if (len(mesh.vertex_colors) == 0): raise NameError('Object is not colored !')
      color = mesh.vertex_colors[0].data[li].color
      vert = mesh.vertices[mesh.loops[li].vertex_index]

      for i in range(0, 3):
        obj["Vertices"].append(round(vert.co[i], 4))
        obj["Colors"].append(round(color[i], 4))
      #endfor
    #endfor
  #endfor

  # NumVertices
  obj["NumVertices"] = int(len(obj["Vertices"]) / 3)

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)

  return obj


def jsv_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jsv')
  data = jsv_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


def jsv_export_binary(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'bsv')
  data = jsv_export(selected_obj)

  with open(file, "wb") as f:
    header = struct.pack('<i', data["NumVertices"])
    f.write(header)

    for vert in data["Vertices"]:
      buf = struct.pack('<f', vert)
      f.write(buf)
    #endfor

    for color in data["Colors"]:
      buf = struct.pack('<f', color)
      f.write(buf)
    #endfor
  #endwith


# ----------------------------------------------------------------------------------
# JLT
# ----------------------------------------------------------------------------------
def jlt_export(selected_obj):
  obj = {
    "Ident": "JLT",
    "Type": "POINT",
    "Position": [],
    "DiffuseColor": [],
    "SpecularColor": [],
    "Intensity": -1,
    "Constant": 1,
    "Linear": 0,
    "Exp": 0,
    "GroupId": 0,
    "SpotCutoff": 0,
    "SpotDirection": [0, -1, 0]    
  }

  # Check for valid object
  if (selected_obj.type != 'LIGHT'): raise NameError('Object is not a light')

  # Check for valid light and fill the type
  if selected_obj.data.type == 'POINT': obj["Type"] = "POINT"
  elif selected_obj.data.type == 'SPOT': obj["Type"] = "SPOT"
  else: raise NameError('Object is not a valid light')

  diffuse = selected_obj.light_properties.diffuse
  specular = selected_obj.light_properties.specular

  local_dir = Vector((0, 0, -1))
  world_dir = selected_obj.matrix_world.to_3x3() @ local_dir
  world_dir.normalize()

  # Fill json object
  obj["Position"] = [-selected_obj.location.x, selected_obj.location.z, selected_obj.location.y]
  obj["DiffuseColor"] = [diffuse.r, diffuse.g, diffuse.b]
  obj["SpecularColor"] = [specular.r, specular.g, specular.b]
  obj["Intensity"] = selected_obj.light_properties.intensity
  obj["Constant"] = selected_obj.light_properties.constant
  obj["Linear"] = selected_obj.light_properties.linear
  obj["Exp"] = selected_obj.light_properties.exp
  obj["GroupId"] = selected_obj.light_properties.group_id
  obj["SpotCutoff"] = selected_obj.light_properties.spot_cutoff_angle
  obj["SpotDirection"] = [-world_dir.x, world_dir.z, world_dir.y]

  # Fill json custom props
  for k, v in selected_obj.items():
    obj[k] = v
  #endfor
  return obj


def jlt_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jlt')
  data = jlt_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# SUN
# ----------------------------------------------------------------------------------
def sun_export(selected_obj):
  obj = {
    "Ident": "SUN",
    "Position": [],
    "DiffuseColor": [],
    "SpecularColor": [],
    "Intensity": -1,
    "Constant": 1,
    "Linear": 0,
    "Exp": 0,
    "GroupId": 0,
    "SpotCutoff": 0,
    "SpotDirection": [0, -1, 0]    
  }

  diffuse = selected_obj.light_properties.diffuse
  specular = selected_obj.light_properties.specular

  local_dir = Vector((0, 0, -1))
  world_dir = selected_obj.matrix_world.to_3x3() @ local_dir
  world_dir.normalize()

  # Fill json object
  # ----------------------------------------------------------------------------------
  obj["SunEnabled"] = bpy.context.scene.world_properties.sun_enabled
  obj["SunPositionX"] = bpy.context.scene.world_properties.sun_position[0]
  obj["SunPositionY"] = bpy.context.scene.world_properties.sun_position[1]
  obj["SunPositionZ"] = bpy.context.scene.world_properties.sun_position[2]
  obj["SunTargetX"] = bpy.context.scene.world_properties.sun_target[0]
  obj["SunTargetY"] = bpy.context.scene.world_properties.sun_target[1]
  obj["SunTargetZ"] = bpy.context.scene.world_properties.sun_target[2]
  obj["SunDiffuseR"] = bpy.context.scene.world_properties.sun_diffuse[0]
  obj["SunDiffuseG"] = bpy.context.scene.world_properties.sun_diffuse[1]
  obj["SunDiffuseB"] = bpy.context.scene.world_properties.sun_diffuse[2]
  obj["SunSpecularR"] = bpy.context.scene.world_properties.sun_specular[0]
  obj["SunSpecularG"] = bpy.context.scene.world_properties.sun_specular[1]
  obj["SunSpecularB"] = bpy.context.scene.world_properties.sun_specular[2]
  obj["SunIntensity"] = bpy.context.scene.world_properties.sun_intensity
  obj["GroupId"] = bpy.context.scene.world_properties.sun_light_group_id



  # Fill json custom props
  for k, v in selected_obj.items():
    obj[k] = v
  #endfor
  return obj


def sun_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'jlt')
  data = sun_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# GRF
# ----------------------------------------------------------------------------------
def grf_export(selected_obj):
  obj = {
    "Ident": "GRF",
    "Nodes": {},
    "Groups": {}
  }

  # Triangulate selected object
  utils.triangulate_mesh(selected_obj)

  # Fetch mesh data
  bm = bmesh.new()
  bm.from_mesh(selected_obj.data)

  # create vertex group lookup dictionary for names
  vgroup_names = {vgroup.index: vgroup.name for vgroup in selected_obj.vertex_groups}

  # create dictionary of vertex group assignments per vertex
  vgroups = {v.index: [vgroup_names[g.group] for g in v.groups] for v in selected_obj.data.vertices}

  # build the graph
  for vert in bm.verts:
    obj["Nodes"][vert.index] = {}
    obj["Nodes"][vert.index]["Pos"] = [-vert.co.x, vert.co.z, vert.co.y]
    obj["Nodes"][vert.index]["G"] = 0
    obj["Nodes"][vert.index]["H"] = 0
    obj["Nodes"][vert.index]["F"] = 0
    obj["Nodes"][vert.index]["Children"] = []

    for e in vert.link_edges:
      v_other = e.other_vert(vert)
      if (v_other.index in obj["Nodes"] and 'NOBACK' in vgroups[vert.index]): continue
      obj['Nodes'][vert.index]['Children'].append(v_other.index)
    #endfor
  #endfor

  # fill groups
  obj["Groups"] = vgroups

  # Destriangulate selected object
  utils.destriangulate_mesh(selected_obj)

  return obj


def grf_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'grf')
  data = grf_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# ANY
# ----------------------------------------------------------------------------------
def any_export(selected_obj):
  obj = {
    "Ident": "ANY",
    "Name": "",
    "Type": "",
    "Position": [],
    "Rotation": [],
    "Scale": [],
    "Width": -1,
    "Height": -1,
    "Depth": -1
  }

  pos = selected_obj.matrix_world.to_translation();
  rot = selected_obj.matrix_world.to_euler('YXZ');
  sca = selected_obj.scale

  # Fill json object
  obj["Name"] = selected_obj.name
  obj["Type"] = selected_obj.name.split('.')[0]
  obj["Position"] = [-pos.x, pos.z, pos.y]
  obj["Rotation"] = [rot.x, -rot.z, rot.y]
  obj["Scale"] = [sca.x, sca.z, sca.y]
  obj["Width"] = selected_obj.dimensions.x
  obj["Height"] = selected_obj.dimensions.z
  obj["Depth"] = selected_obj.dimensions.y

  # Fill json custom props
  for k, v in selected_obj.items():
    if isinstance(v, (int, float, str, bool)):
      obj[k] = v
    elif hasattr(v, "to_list") and hasattr(v, "__getitem__"):
      obj[k] = v[:]
    # obj[k] = v
  #endfor
  return obj


def any_export_json(selected_obj, path, filename):
  file = utils.get_available_filename(path, filename, 'any')
  data = any_export(selected_obj)

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# MAT
# ----------------------------------------------------------------------------------
def mat_export(selected_obj):
  obj = {
    "Ident": "MAT",
    "Flipbooks": [],
    "CustomParams": []
  }

  # Fill json object
  obj["Id"] = selected_obj.mat_properties.id
  obj["Opacity"] = selected_obj.mat_properties.opacity
  # ----------------------------------------------------------------------------------
  obj["ShadowEnabled"] = selected_obj.mat_properties.shadow_enabled
  # ----------------------------------------------------------------------------------
  obj["DecalEnabled"] = selected_obj.mat_properties.decal_enabled
  obj["DecalGroup"] = selected_obj.mat_properties.decal_group
  # ----------------------------------------------------------------------------------
  obj["LightEnabled"] = selected_obj.mat_properties.light_enabled
  obj["LightGroup"] = selected_obj.mat_properties.light_group
  obj["LightGouraudShadingEnabled"] = selected_obj.mat_properties.light_gouraud_shading_enabled
  # ----------------------------------------------------------------------------------
  obj["Texture"] = bpy.path.basename(selected_obj.mat_properties.texture)
  obj["TextureScrollAngle"] = selected_obj.mat_properties.texture_scroll_angle
  obj["TextureScrollRate"] = selected_obj.mat_properties.texture_scroll_rate
  obj["TextureOffsetX"] = selected_obj.mat_properties.texture_offset[0]
  obj["TextureOffsetY"] = selected_obj.mat_properties.texture_offset[1]
  obj["TextureScaleX"] = selected_obj.mat_properties.texture_scale[0]
  obj["TextureScaleY"] = selected_obj.mat_properties.texture_scale[1]
  obj["TextureRotationAngle"] = selected_obj.mat_properties.texture_rotation_angle
  obj["TextureOpacity"] = selected_obj.mat_properties.texture_opacity
  obj["TextureBlendColorR"] = selected_obj.mat_properties.texture_blend_color[0]
  obj["TextureBlendColorG"] = selected_obj.mat_properties.texture_blend_color[1]
  obj["TextureBlendColorB"] = selected_obj.mat_properties.texture_blend_color[2]
  obj["TextureBlendColorMode"] = selected_obj.mat_properties.texture_blend_color_mode
  obj["TextureBlendColorMix"] = selected_obj.mat_properties.texture_blend_color_mix
  # ----------------------------------------------------------------------------------
  obj["SecondaryTexture"] = bpy.path.basename(selected_obj.mat_properties.secondary_texture)
  obj["SecondaryTextureScrollAngle"] = selected_obj.mat_properties.secondary_texture_scroll_angle
  obj["SecondaryTextureScrollRate"] = selected_obj.mat_properties.secondary_texture_scroll_rate
  obj["SecondaryTextureOffsetX"] = selected_obj.mat_properties.secondary_texture_offset[0]
  obj["SecondaryTextureOffsetY"] = selected_obj.mat_properties.secondary_texture_offset[1]
  obj["SecondaryTextureScaleX"] = selected_obj.mat_properties.secondary_texture_scale[0]
  obj["SecondaryTextureScaleY"] = selected_obj.mat_properties.secondary_texture_scale[1]
  obj["SecondaryTextureRotationAngle"] = selected_obj.mat_properties.secondary_texture_rotation_angle
  obj["SecondaryTextureOpacity"] = selected_obj.mat_properties.secondary_texture_opacity
  obj["SecondaryTextureBlendMode"] = selected_obj.mat_properties.secondary_texture_blend_mode
  obj["SecondaryTextureBlendColorR"] = selected_obj.mat_properties.secondary_texture_blend_color[0]
  obj["SecondaryTextureBlendColorG"] = selected_obj.mat_properties.secondary_texture_blend_color[1]
  obj["SecondaryTextureBlendColorB"] = selected_obj.mat_properties.secondary_texture_blend_color[2]
  obj["SecondaryTextureBlendColorMode"] = selected_obj.mat_properties.secondary_texture_blend_color_mode
  obj["SecondaryTextureBlendColorMix"] = selected_obj.mat_properties.secondary_texture_blend_color_mix
  # ----------------------------------------------------------------------------------
  obj["EnvMapRight"] = bpy.path.basename(selected_obj.mat_properties.env_map_right)
  obj["EnvMapLeft"] = bpy.path.basename(selected_obj.mat_properties.env_map_left)
  obj["EnvMapTop"] = bpy.path.basename(selected_obj.mat_properties.env_map_top)
  obj["EnvMapBottom"] = bpy.path.basename(selected_obj.mat_properties.env_map_bottom)
  obj["EnvMapFront"] = bpy.path.basename(selected_obj.mat_properties.env_map_front)
  obj["EnvMapBack"] = bpy.path.basename(selected_obj.mat_properties.env_map_back)
  obj["EnvMapOpacity"] = selected_obj.mat_properties.env_map_opacity
  # ----------------------------------------------------------------------------------
  obj["NormalMap"] = bpy.path.basename(selected_obj.mat_properties.normal_map)
  obj["NormalMapScrollAngle"] = selected_obj.mat_properties.normal_map_scroll_angle
  obj["NormalMapScrollRate"] = selected_obj.mat_properties.normal_map_scroll_rate
  obj["NormalMapOffsetX"] = selected_obj.mat_properties.normal_map_offset[0]
  obj["NormalMapOffsetY"] = selected_obj.mat_properties.normal_map_offset[1]
  obj["NormalMapScaleX"] = selected_obj.mat_properties.normal_map_scale[0]
  obj["NormalMapScaleY"] = selected_obj.mat_properties.normal_map_scale[1]
  obj["NormalMapRotationAngle"] = selected_obj.mat_properties.normal_map_rotation_angle
  obj["NormalMapIntensity"] = selected_obj.mat_properties.normal_map_intensity
  # ----------------------------------------------------------------------------------
  obj["DisplacementMap"] = bpy.path.basename(selected_obj.mat_properties.displacement_map)
  obj["DisplacementMapScrollAngle"] = selected_obj.mat_properties.displacement_map_scroll_angle
  obj["DisplacementMapScrollRate"] = selected_obj.mat_properties.displacement_map_scroll_rate
  obj["DisplacementMapOffsetX"] = selected_obj.mat_properties.displacement_map_offset[0]
  obj["DisplacementMapOffsetY"] = selected_obj.mat_properties.displacement_map_offset[1]
  obj["DisplacementMapScaleX"] = selected_obj.mat_properties.displacement_map_scale[0]
  obj["DisplacementMapScaleY"] = selected_obj.mat_properties.displacement_map_scale[1]
  obj["DisplacementMapRotationAngle"] = selected_obj.mat_properties.displacement_map_rotation_angle
  obj["DisplacementMapFactor"] = selected_obj.mat_properties.displacement_map_factor
  obj["DisplaceTexture"] = selected_obj.mat_properties.displace_texture
  obj["DisplaceSecondaryTexture"] = selected_obj.mat_properties.displace_secondary_texture
  obj["DisplaceNormalMap"] = selected_obj.mat_properties.displace_normal_map
  obj["DisplaceDissolveMap"] = selected_obj.mat_properties.displace_dissolve_map
  obj["DisplaceEnvMap"] = selected_obj.mat_properties.displace_env_map
  # ----------------------------------------------------------------------------------
  obj["DissolveMap"] = bpy.path.basename(selected_obj.mat_properties.dissolve_map)
  obj["DissolveMapScrollAngle"] = selected_obj.mat_properties.dissolve_map_scroll_angle
  obj["DissolveMapScrollRate"] = selected_obj.mat_properties.dissolve_map_scroll_rate
  obj["DissolveMapOffsetX"] = selected_obj.mat_properties.dissolve_map_offset[0]
  obj["DissolveMapOffsetY"] = selected_obj.mat_properties.dissolve_map_offset[1]
  obj["DissolveMapScaleX"] = selected_obj.mat_properties.dissolve_map_scale[0]
  obj["DissolveMapScaleY"] = selected_obj.mat_properties.dissolve_map_scale[1]
  obj["DissolveMapRotationAngle"] = selected_obj.mat_properties.dissolve_map_rotation_angle
  obj["DissolveGlowR"] = selected_obj.mat_properties.dissolve_glow[0]
  obj["DissolveGlowG"] = selected_obj.mat_properties.dissolve_glow[1]
  obj["DissolveGlowB"] = selected_obj.mat_properties.dissolve_glow[2]
  obj["DissolveGlowRange"] = selected_obj.mat_properties.dissolve_glow_range
  obj["DissolveGlowFalloff"] = selected_obj.mat_properties.dissolve_glow_falloff
  obj["DissolveAmount"] = selected_obj.mat_properties.dissolve_amount
  # ----------------------------------------------------------------------------------
  obj["JitterVertexEnabled"] = selected_obj.mat_properties.jitter_vertex_enabled
  obj["JitterVertexLevel"] = selected_obj.mat_properties.jitter_vertex_level
  # ----------------------------------------------------------------------------------
  obj["ToonMap"] = bpy.path.basename(selected_obj.mat_properties.toon_map)
  obj["ToonMapOpacity"] = selected_obj.mat_properties.toon_map_opacity
  obj["ToonLightDirX"] = selected_obj.mat_properties.toon_light_dir[0]
  obj["ToonLightDirY"] = selected_obj.mat_properties.toon_light_dir[1]
  obj["ToonLightDirZ"] = selected_obj.mat_properties.toon_light_dir[2]
  # ----------------------------------------------------------------------------------
  obj["AlphaBlendFacing"] = selected_obj.mat_properties.alpha_blend_facing
  obj["AlphaBlendDistance"] = selected_obj.mat_properties.alpha_blend_distance
  # ----------------------------------------------------------------------------------
  obj["ArcadeEnabled"] = selected_obj.mat_properties.arcade_enabled
  obj["ArcadeStartColorR"] = selected_obj.mat_properties.arcade_start_color[0]
  obj["ArcadeStartColorG"] = selected_obj.mat_properties.arcade_start_color[1]
  obj["ArcadeStartColorB"] = selected_obj.mat_properties.arcade_start_color[2]
  obj["ArcadeEndColorR"] = selected_obj.mat_properties.arcade_end_color[0]
  obj["ArcadeEndColorG"] = selected_obj.mat_properties.arcade_end_color[1]
  obj["ArcadeEndColorB"] = selected_obj.mat_properties.arcade_end_color[2]
  obj["ArcadeSharpColorR"] = selected_obj.mat_properties.arcade_sharp_color[0]
  obj["ArcadeSharpColorG"] = selected_obj.mat_properties.arcade_sharp_color[1]
  obj["ArcadeSharpColorB"] = selected_obj.mat_properties.arcade_sharp_color[2]
  # ----------------------------------------------------------------------------------
  obj["EmissiveMap"] = bpy.path.basename(selected_obj.mat_properties.emissive_map)
  obj["EmissiveFactor"] = selected_obj.mat_properties.emissive_factor
  obj["EmissiveR"] = selected_obj.mat_properties.emissive[0]
  obj["EmissiveG"] = selected_obj.mat_properties.emissive[1]
  obj["EmissiveB"] = selected_obj.mat_properties.emissive[2]
  # ----------------------------------------------------------------------------------
  obj["AmbientR"] = selected_obj.mat_properties.ambient[0]
  obj["AmbientG"] = selected_obj.mat_properties.ambient[1]
  obj["AmbientB"] = selected_obj.mat_properties.ambient[2]
  # ----------------------------------------------------------------------------------
  obj["DiffuseMap"] = bpy.path.basename(selected_obj.mat_properties.diffuse_map)
  obj["DiffuseR"] = selected_obj.mat_properties.diffuse[0]
  obj["DiffuseG"] = selected_obj.mat_properties.diffuse[1]
  obj["DiffuseB"] = selected_obj.mat_properties.diffuse[2]
  # ----------------------------------------------------------------------------------
  obj["SpecularMap"] = bpy.path.basename(selected_obj.mat_properties.specular_map)
  obj["SpecularFactor"] = selected_obj.mat_properties.specular_factor
  obj["SpecularR"] = selected_obj.mat_properties.specular[0]
  obj["SpecularG"] = selected_obj.mat_properties.specular[1]
  obj["SpecularB"] = selected_obj.mat_properties.specular[2]
  # ----------------------------------------------------------------------------------
  obj["ThuneMap"] = bpy.path.basename(selected_obj.mat_properties.thune_map)
  obj["ThuneMapShininessEnabled"] = selected_obj.mat_properties.thune_map_shininess_enabled
  obj["ThuneMapArcadeEnabled"] = selected_obj.mat_properties.thune_map_arcade_enabled
  obj["ThuneMapReflectiveEnabled"] = selected_obj.mat_properties.thune_map_reflective_enabled

  # Flipbooks
  for anim in selected_obj.material_animations:
    obj["Flipbooks"].append({
      "TextureTarget": anim.texture_target,
      "FrameWidth": anim.frame_width,
      "FrameHeight": anim.frame_height,
      "NumCol": anim.num_col,
      "NumRow": anim.num_row,
      "NumFrames": anim.num_frames,
      "FrameDuration": anim.frame_duration
    })
  #endfor

  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s00_name, "Value": selected_obj.mat_properties.s00_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s01_name, "Value": selected_obj.mat_properties.s01_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s02_name, "Value": selected_obj.mat_properties.s02_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s03_name, "Value": selected_obj.mat_properties.s03_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s04_name, "Value": selected_obj.mat_properties.s04_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s05_name, "Value": selected_obj.mat_properties.s05_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s06_name, "Value": selected_obj.mat_properties.s06_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s07_name, "Value": selected_obj.mat_properties.s07_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s08_name, "Value": selected_obj.mat_properties.s08_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s09_name, "Value": selected_obj.mat_properties.s09_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s10_name, "Value": selected_obj.mat_properties.s10_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s11_name, "Value": selected_obj.mat_properties.s11_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s12_name, "Value": selected_obj.mat_properties.s12_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s13_name, "Value": selected_obj.mat_properties.s13_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s14_name, "Value": selected_obj.mat_properties.s14_value })
  obj["CustomParams"].append({ "Name": selected_obj.mat_properties.s15_name, "Value": selected_obj.mat_properties.s15_value })

  obj["S0Texture"] = bpy.path.basename(selected_obj.mat_properties.s0_texture)
  obj["S1Texture"] = bpy.path.basename(selected_obj.mat_properties.s1_texture)
  return obj


def mat_export_json(selected_obj, path, filename):
  resources_files = []
  file = utils.get_available_filename(path, filename, 'mat')
  data = mat_export(selected_obj)

  for key, value in selected_obj.mat_properties.items():
    if key in MATERIAL_FILE_PROPS and value != "":
      shutil.copy(bpy.path.abspath(value), path + bpy.path.basename(value))
      resources_files.append(path + bpy.path.basename(value))
    #endif
  #endfor

  with open(file, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
  #endwith
  return resources_files


# ----------------------------------------------------------------------------------
# OBJ
# ----------------------------------------------------------------------------------
def export_obj(selected_obj, path, filename):
  resources_files = []
  file = utils.get_available_filename(path, filename, 'obj')
  obj_exporter(selected_obj, path, selected_obj.name)
  return resources_files


# ----------------------------------------------------------------------------------
# CAMERA
# ----------------------------------------------------------------------------------
def camera_export_json(path, filename):
  obj = {
    "Ident": "CAM"
  }

  camera = bpy.data.objects["Camera"]
  pos = camera.matrix_world.to_translation()
  matrix = utils.get_camera_matrix_converted_for_engine(camera)
  rotation = matrix.to_euler('YXZ')
  fovy = camera.data.angle_y

  if camera.data.sensor_fit == 'VERTICAL':
    # FOV vertical affiché
    fovy = 2 * atan((camera.data.sensor_height * 0.5) / camera.data.lens)
  else:
    # FOV horizontal affiché (cas par défaut)
    fovy = 2 * atan((camera.data.sensor_width * 0.5) / camera.data.lens)

  # Fill json object
  obj["ProjectionMode"] = "PERSPECTIVE" if camera.data.type == 'PERSP' else "ORTHOGRAPHIC"
  obj["PositionX"] = -pos.x
  obj["PositionY"] = pos.z
  obj["PositionZ"] = pos.y
  obj["RotationX"] = rotation.x
  obj["RotationY"] = rotation.y
  obj["RotationZ"] = rotation.z
  obj["PerspectiveFovy"] = fovy
  obj["PerspectiveNear"] = camera.data.clip_start
  obj["PerspectiveFar"] = camera.data.clip_end
  obj["OrthographicSize"] = camera.data.ortho_scale
  obj["ClipOffsetX"] = bpy.context.scene.world_properties.camera_clip_offset[0]
  obj["ClipOffsetY"] = bpy.context.scene.world_properties.camera_clip_offset[1]
  obj["MinClipOffsetX"] = bpy.context.scene.world_properties.camera_min_clip_offset[0]
  obj["MinClipOffsetY"] = bpy.context.scene.world_properties.camera_min_clip_offset[1]
  obj["MaxClipOffsetX"] = bpy.context.scene.world_properties.camera_max_clip_offset[0]
  obj["MaxClipOffsetY"] = bpy.context.scene.world_properties.camera_max_clip_offset[1]

  if bpy.context.scene.world_properties.camera_matrix_export_enabled:
    obj["CameraMatrix"] = [matrix[0][0], matrix[0][1], matrix[0][2], matrix[0][3], matrix[1][0], matrix[1][1], matrix[1][2], matrix[1][3], matrix[2][0], matrix[2][1], matrix[2][2], matrix[2][3], matrix[3][0], matrix[3][1], matrix[3][2], matrix[3][3]]

  file = utils.get_available_filename(path, filename, 'cam')
  with open(file, 'w', encoding='utf-8') as f:
    json.dump(obj, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# WORLD
# ----------------------------------------------------------------------------------
def world_export_json(path, filename):
  obj = {
    "Ident": "WORLD"
  }

  # Fill json object
  obj["ShadowEnabled"] = bpy.context.scene.world_properties.shadow_enabled
  obj["ShadowPositionX"] = bpy.context.scene.world_properties.shadow_position[0]
  obj["ShadowPositionY"] = bpy.context.scene.world_properties.shadow_position[1]
  obj["ShadowPositionZ"] = bpy.context.scene.world_properties.shadow_position[2]
  obj["ShadowTargetX"] = bpy.context.scene.world_properties.shadow_target[0]
  obj["ShadowTargetY"] = bpy.context.scene.world_properties.shadow_target[1]
  obj["ShadowTargetZ"] = bpy.context.scene.world_properties.shadow_target[2]
  obj["ShadowSize"] = bpy.context.scene.world_properties.shadow_size
  obj["ShadowDepth"] = bpy.context.scene.world_properties.shadow_depth
  # ----------------------------------------------------------------------------------
  obj["FogEnabled"] = bpy.context.scene.world_properties.fog_enabled
  obj["FogNear"] = bpy.context.scene.world_properties.fog_near
  obj["FogFar"] = bpy.context.scene.world_properties.fog_far
  obj["FogColorR"] = bpy.context.scene.world_properties.fog_color[0]
  obj["FogColorG"] = bpy.context.scene.world_properties.fog_color[1]
  obj["FogColorB"] = bpy.context.scene.world_properties.fog_color[2]
  # ----------------------------------------------------------------------------------
  obj["AmbientR"] = bpy.context.scene.world_properties.ambient[0]
  obj["AmbientG"] = bpy.context.scene.world_properties.ambient[1]
  obj["AmbientB"] = bpy.context.scene.world_properties.ambient[2]
  # ----------------------------------------------------------------------------------
  obj["DecalAtlas"] = bpy.path.basename(bpy.context.scene.world_properties.decal_atlas)
  # ----------------------------------------------------------------------------------
  obj["CustomParams"] = []
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s00_name, "Value": bpy.context.scene.world_properties.world_s00_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s01_name, "Value": bpy.context.scene.world_properties.world_s01_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s02_name, "Value": bpy.context.scene.world_properties.world_s02_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s03_name, "Value": bpy.context.scene.world_properties.world_s03_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s04_name, "Value": bpy.context.scene.world_properties.world_s04_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s05_name, "Value": bpy.context.scene.world_properties.world_s05_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s06_name, "Value": bpy.context.scene.world_properties.world_s06_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s07_name, "Value": bpy.context.scene.world_properties.world_s07_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s08_name, "Value": bpy.context.scene.world_properties.world_s08_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s09_name, "Value": bpy.context.scene.world_properties.world_s09_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s10_name, "Value": bpy.context.scene.world_properties.world_s10_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s11_name, "Value": bpy.context.scene.world_properties.world_s11_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s12_name, "Value": bpy.context.scene.world_properties.world_s12_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s13_name, "Value": bpy.context.scene.world_properties.world_s13_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s14_name, "Value": bpy.context.scene.world_properties.world_s14_value })
  obj["CustomParams"].append({ "Name": bpy.context.scene.world_properties.world_s15_name, "Value": bpy.context.scene.world_properties.world_s15_value })

  file = utils.get_available_filename(path, filename, 'world')
  with open(file, 'w', encoding='utf-8') as f:
    json.dump(obj, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# SAMPLER
# ----------------------------------------------------------------------------------
def sampler_export_json(selected_obj, path, filename):
  obj = {
    "Ident": "TEX",
  }

  # Fill json object
  obj["AddressModeU"] = selected_obj.mat_properties.sampler_address_mode_u
  obj["AddressModeV"] = selected_obj.mat_properties.sampler_address_mode_v
  obj["AddressModeW"] = selected_obj.mat_properties.sampler_address_mode_w
  obj["MagFilter"] = selected_obj.mat_properties.sampler_mag_filter
  obj["MinFilter"] = selected_obj.mat_properties.sampler_min_filter
  obj["MipMapFilter"] = selected_obj.mat_properties.sampler_mipmap_filter
  obj["LodMinClamp"] = selected_obj.mat_properties.sampler_lod_min_clamp
  obj["LodMaxClamp"] = selected_obj.mat_properties.sampler_lod_max_clamp
  obj["MaxAnisotropy"] = selected_obj.mat_properties.sampler_max_anisotropy
  obj["Type"] = selected_obj.mat_properties.sampler_type

  file = utils.get_available_filename(path, filename, 'tex')
  with open(file, 'w', encoding='utf-8') as f:
    json.dump(obj, f, ensure_ascii=False)
  #endwith


# ----------------------------------------------------------------------------------
# PACK
# ----------------------------------------------------------------------------------
def pack(path, context):
  path = os.path.join(path, "")
  path_list = []

  world_export_json(path, "scene")
  path_list.append(path + 'scene.world')

  camera_export_json(path, "scene")
  path_list.append(path + 'scene.cam')

  for collection in bpy.data.collections:
    if (collection.name == "JAM"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jam_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.bam')
        else:
          jam_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jam')
        #endif
        mat_export_json(obj, path, obj.name)
        path_list.append(path + obj.name + '.mat')
      #endfor
    #endif

    if (collection.name == "JSM"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jsm_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.bsm')
        else:
          jsm_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jsm')
        #endif
        mat_export_json(obj, path, obj.name)
        path_list.append(path + obj.name + '.mat')
      #endfor
    #endif

    if (collection.name == "JWM"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jwm_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.bwm')
        else:
          jwm_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jwm')
        #endif
      #endfor
    #endif

    if (collection.name == "JNM"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jnm_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.bnm')
        else:
          jnm_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jnm')
        #endif
      #endfor
    #endif

    if (collection.name == "JLM"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jlm_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.blm')
        else:
          jlm_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jlm')
        #endif
      #endfor
    #endif

    if (collection.name == "JSV"):
      for obj in collection.objects:
        if context.scene.world_properties.enable_export_has_binary:
          jsv_export_binary(obj, path, obj.name)
          path_list.append(path + obj.name + '.bsv')
        else:
          jsv_export_json(obj, path, obj.name)
          path_list.append(path + obj.name + '.jsv')
        #endif
      #endfor
    #endif

    if (collection.name == "JLT"):
      for obj in collection.objects:
        jlt_export_json(obj, path, obj.name)
        path_list.append(path + obj.name + '.jlt')
      #endfor
    #endif

    if (collection.name == "GRF"):
      for obj in collection.objects:
        grf_export_json(obj, path, obj.name)
        path_list.append(path + obj.name + '.grf')
      #endfor
    #endif

    if (collection.name == "OBJ"):
      for obj in collection.objects:
        obj_exporter(obj, path, obj.name)
        path_list.append(path + obj.name + '.obj')
        path_list.append(path + obj.name + '.mtl')
      #endfor
    #endif

    if (collection.name == "ANY"):
      for obj in collection.objects:
        any_export_json(obj, path, obj.name)
        path_list.append(path + obj.name + '.any')
      #endfor
    #endif

    # textures
    for obj in collection.objects:
      for key, value in obj.mat_properties.items():
        if key in MATERIAL_FILE_PROPS and value != "":
          dest_path = path + bpy.path.basename(value)
          shutil.copyfile(bpy.path.abspath(value), dest_path)
          
          if dest_path not in path_list:
            path_list.append(dest_path)
          #endif
        #endif
      #endfor
    #endfor

    # samplers
    for obj in collection.objects:
      for key, value in obj.mat_properties.items():
        if key in MATERIAL_FILE_PROPS and value != "" and obj.mat_properties.sampler_enabled:
          filename_only = Path(value).stem
          dest_path = path + filename_only + '.tex'
          sampler_export_json(obj, path, filename_only)

          if dest_path not in path_list:
            path_list.append(dest_path)
          #endif
        #endif
      #endfor
    #endfor
  #endfor

  if context.scene.world_properties.decal_atlas:
    value = context.scene.world_properties.decal_atlas
    dest_path = path + bpy.path.basename(value)
    shutil.copyfile(bpy.path.abspath(value), dest_path)

    if dest_path not in path_list:
      path_list.append(dest_path)
    #endif
  #endif

  scene_name = os.path.basename(bpy.data.filepath)
  utils.zip_files(path_list, path + scene_name + '.pak')

  for file in path_list:
    
    os.remove(file)
  #endfor