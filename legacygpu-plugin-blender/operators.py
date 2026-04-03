import bpy
from . import functions
from . import utils
# ----------------------------------------------------------------------------------


def register():
  bpy.utils.register_class(WARME_OT_export_objects)
  bpy.utils.register_class(WARME_OT_export_pack)
  bpy.utils.register_class(WARME_OT_export_world)
  bpy.utils.register_class(WARME_OT_copy_camera_matrix)
  bpy.utils.register_class(WARME_OT_copy_object_position) 
  bpy.utils.register_class(WARME_OT_copy_object_rotation)
  bpy.utils.register_class(WARME_OT_add_animation)
  bpy.utils.register_class(WARME_OT_remove_animation)
  bpy.utils.register_class(WARME_OT_material_add_animation)
  bpy.utils.register_class(WARME_OT_material_remove_animation)


def unregister():
  bpy.utils.unregister_class(WARME_OT_export_objects)
  bpy.utils.unregister_class(WARME_OT_export_pack)
  bpy.utils.unregister_class(WARME_OT_export_world)
  bpy.utils.unregister_class(WARME_OT_copy_camera_matrix)
  bpy.utils.unregister_class(WARME_OT_copy_object_position) 
  bpy.utils.unregister_class(WARME_OT_copy_object_rotation)
  bpy.utils.unregister_class(WARME_OT_add_animation)
  bpy.utils.unregister_class(WARME_OT_remove_animation)
  bpy.utils.unregister_class(WARME_OT_material_add_animation)
  bpy.utils.unregister_class(WARME_OT_material_remove_animation)


class WARME_OT_export_objects(bpy.types.Operator):
  """Export only selected objects""" 
  bl_idname = "object.export_objects"
  bl_label = "Export Objects"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    for object in bpy.context.selected_objects:
      if (object.type == 'CAMERA'):
        functions.camera_export(bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
        continue
      #endif

      if (utils.belong_to_collection(object, "JSM")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jsm_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jsm_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        functions.mat_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "OBJ")):
        functions.export_obj(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JAM")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jam_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jam_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        functions.mat_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JWM")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jwm_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jwm_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JNM")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jnm_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jnm_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JSV")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jsv_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jsv_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "GRF")):
        functions.grf_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JLM")):
        if (context.scene.world_properties.enable_export_has_binary):
          functions.jlm_export_binary(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        else:
          functions.jlm_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        #endif
        self.report({'INFO'}, "Export successful ✔")
      #endif

      if (utils.belong_to_collection(object, "JLT")):
        functions.jlt_export_json(object, bpy.path.abspath(context.scene.render.filepath), object.name)
        self.report({'INFO'}, "Export successful ✔")
      #endif
    #endfor
    return {"FINISHED"}


class WARME_OT_export_pack(bpy.types.Operator):
  """Export Pack""" 
  bl_idname = "object.export_pack"
  bl_label = "Export All (Packed)"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    functions.pack(bpy.path.abspath(context.scene.render.filepath), context)
    self.report({'INFO'}, "Export successful ✔")
    return {"FINISHED"}


class WARME_OT_export_world(bpy.types.Operator):
  """Export World""" 
  bl_idname = "object.export_world"
  bl_label = "Export World"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    functions.export_world(bpy.path.abspath(context.scene.render.filepath), "scene")
    self.report({'INFO'}, "Export successful ✔")
    return {"FINISHED"}


class WARME_OT_add_animation(bpy.types.Operator):
  """Add animation""" 
  bl_idname = "object.add_animation"
  bl_label = "Add"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}
  
  def execute(self, context):
    temp = context.object.jam_animations[-1].end_frame if len(context.object.jam_animations) > 0 else 0
    item = context.object.jam_animations.add()
    item.start_frame = temp
    item.end_frame = temp
    return {"FINISHED"}


class WARME_OT_remove_animation(bpy.types.Operator):
  """Remove last animation""" 
  bl_idname = "object.remove_animation"
  bl_label = "Remove"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    context.object.jam_animations.remove(len(bpy.context.object.jam_animations) - 1)
    return {"FINISHED"}


class WARME_OT_copy_camera_matrix(bpy.types.Operator):
  """Copy camera matrix""" 
  bl_idname = "object.copy_camera_matrix"
  bl_label = "Copy Camera Matrix"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    matrix = matrix = utils.get_camera_matrix_converted_for_engine(bpy.data.objects["Camera"])
    matrix_string = f"{matrix[0][0]}, {matrix[0][1]}, {matrix[0][2]}, {matrix[0][3]}, {matrix[1][0]}, {matrix[1][1]}, {matrix[1][2]}, {matrix[1][3]}, {matrix[2][0]}, {matrix[2][1]}, {matrix[2][2]}, {matrix[2][3]}, {matrix[3][0]}, {matrix[3][1]}, {matrix[3][2]}, {matrix[3][3]}"
    context.window_manager.clipboard = matrix_string
    return {"FINISHED"}


class WARME_OT_copy_object_position(bpy.types.Operator):
  """Copy object position""" 
  bl_idname = "object.copy_object_position"
  bl_label = "Copy Position"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    # Fetch selected object
    pos = utils.get_position_of_object(bpy.context.object)
    position_string = f"{pos[0]:.4f}, {pos[1]:.4f}, {pos[2]:.4f}"
    context.window_manager.clipboard = position_string
    return {'FINISHED'}


class WARME_OT_copy_object_rotation(bpy.types.Operator):
  """Copy object rotation""" 
  bl_idname = "object.copy_object_rotation"
  bl_label = "Copy Rotation"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    # Fetch selected object
    rot = utils.get_rotation_of_object(bpy.context.object)
    rotation_string = f"{rot[0]:.4f}, {rot[1]:.4f}, {rot[2]:.4f}"
    context.window_manager.clipboard = rotation_string
    return {"FINISHED"}


class WARME_OT_material_add_animation(bpy.types.Operator):
  """Add animation""" 
  bl_idname = "object.material_add_animation"
  bl_label = "Add"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    item = context.object.material_animations.add()
    return {"FINISHED"}


class WARME_OT_material_remove_animation(bpy.types.Operator):
  """Remove last animation""" 
  bl_idname = "object.material_remove_animation"
  bl_label = "Remove"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    context.object.material_animations.remove(len(bpy.context.object.material_animations) - 1)
    return {"FINISHED"}
