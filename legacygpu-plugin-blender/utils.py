import bpy
import zipfile
import bmesh
import os
from pathlib import Path
# ----------------------------------------------------------------------------------


def get_utf8_file_descriptor(path, filename, extension):
  file = get_available_filename(path, filename, extension)
  with open(file, 'w', encoding='utf-8') as f:
    return f
  #endwith


def get_binary_file_descriptor(path, filename, extension):
  file = get_available_filename(path, filename, extension)
  with open(file, 'wb') as f:
    return f
  #endwith


def get_available_filename(path, filename, extension):
  if path == "":
    path = bpy.path.abspath("//")
  #endif

  file = Path(path + "/" + filename + "." + extension)
  return file


def zip_files(path_list, output_path):
  with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for file in path_list:
      zipf.write(file, os.path.basename(file))
    #endfor
  #endwith


def triangulate_mesh(obj):
  bpy.context.view_layer.objects.active = obj
  bpy.ops.object.mode_set(mode="EDIT")
  bm = bmesh.from_edit_mesh(obj.data)
  bmesh.ops.triangulate(bm, faces=bm.faces[:])
  bmesh.update_edit_mesh(obj.data)
  bpy.ops.object.mode_set(mode="OBJECT")


def destriangulate_mesh(mesh_obj):
  bpy.context.view_layer.objects.active = mesh_obj
  bpy.ops.object.mode_set(mode="EDIT")
  bpy.ops.mesh.select_all(action="SELECT")
  bpy.ops.mesh.tris_convert_to_quads()
  bpy.ops.object.mode_set(mode="OBJECT")


def get_camera_matrix_converted_for_engine(cam):
  matrix = cam.matrix_world.to_4x4().transposed()
  tmp = matrix[0][1]; matrix[0][1] = matrix[0][2]; matrix[0][2] = tmp
  tmp = matrix[1][1]; matrix[1][1] = matrix[1][2]; matrix[1][2] = tmp
  tmp = matrix[2][1]; matrix[2][1] = matrix[2][2]; matrix[2][2] = tmp
  tmp = matrix[3][1]; matrix[3][1] = matrix[3][2]; matrix[3][2] = tmp
  matrix[0][0] = matrix[0][0] * -1
  matrix[1][0] = matrix[1][0] * -1
  matrix[2][0] = matrix[2][0] * -1
  matrix[3][0] = matrix[3][0] * -1
  return matrix


def get_position_of_object(obj):
  pos = obj.matrix_world.to_translation()
  return [-pos.x, pos.z, pos.y]


def get_rotation_of_object(obj):
  if obj.type == 'CAMERA':
    camera_matrix = get_camera_matrix_converted_for_engine(obj)
    rot = camera_matrix.to_euler('YXZ')
    return [rot.x, rot.y, rot.z]
  else:
    rot = bpy.context.object.matrix_world.to_euler('YXZ')
    return [rot.x, rot.y, rot.z]


def obj_exporter(obj, path, name):
  FORWARD_AXIS = 'Z'
  UP_AXIS = 'Y'

  # Désélectionner tout
  bpy.ops.object.select_all(action='DESELECT')

  # Sélectionner l’objet à exporter
  obj.select_set(True)
  bpy.context.view_layer.objects.active = obj

  filepath = os.path.join(path, name + ".obj")

  # Blender 3.6+ (nouvel exporter)
  bpy.ops.wm.obj_export(
    filepath=filepath,
    export_selected_objects=True,
    forward_axis =FORWARD_AXIS,
    up_axis=UP_AXIS,
    export_uv=True,
    export_normals=True,
    export_smooth_groups=True,
    export_materials=True,
    export_triangulated_mesh=True,
    global_scale=1.0
  )


def draw_foldout(layout, props, attr, label, icon='NONE'):
  box = layout.box()
  row = box.row()
  row.prop(props, attr, 
          icon="TRIA_DOWN" if getattr(props, attr) else "TRIA_RIGHT",
          icon_only=True, emboss=False)
  row.label(text=label, icon=icon)
  return box, getattr(props, attr)


def draw_input_row(layout, props, attr, label, index=None):
  row = layout.row()
  row.label(text=label)

  if index is not None:
    row.prop(props, attr, text="", index=index)
  else:
    row.prop(props, attr, text="")


def draw_title_row(layout, title):
  row = layout.row()
  row.alignment = 'CENTER'
  row.label(text=title)


def get_or_create_collection(collection_name):
  if collection_name in bpy.data.collections:
    collection = bpy.data.collections[collection_name]
    return collection
  else:
    collection = bpy.data.collections.new(collection_name)
    bpy.context.scene.collection.children.link(collection)
    return collection


def unlink_from_all_collections(obj):
  for col in obj.users_collection[:]:
    col.objects.unlink(obj)
  #endfor


def belong_to_collection(obj, collection):
  for col in obj.users_collection[:]:
    if col.name == collection:
      return True
    #endif
  #endfor


