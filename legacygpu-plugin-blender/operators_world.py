import bpy
import bmesh
from . import functions
from . import utils
# ----------------------------------------------------------------------------------


def register():
  bpy.utils.register_class(WARME_OT_create_jsm)
  bpy.utils.register_class(WARME_OT_cast_to_jsm)
  bpy.utils.register_class(WARME_OT_create_obj)
  bpy.utils.register_class(WARME_OT_cast_to_obj)
  bpy.utils.register_class(WARME_OT_create_jam)
  bpy.utils.register_class(WARME_OT_cast_to_jam)
  bpy.utils.register_class(WARME_OT_create_jwm)
  bpy.utils.register_class(WARME_OT_cast_to_jwm)
  bpy.utils.register_class(WARME_OT_create_jnm)
  bpy.utils.register_class(WARME_OT_cast_to_jnm)
  bpy.utils.register_class(WARME_OT_create_jsv)
  bpy.utils.register_class(WARME_OT_cast_to_jsv)
  bpy.utils.register_class(WARME_OT_create_grf)
  bpy.utils.register_class(WARME_OT_cast_to_grf)
  bpy.utils.register_class(WARME_OT_create_jlm_points)
  bpy.utils.register_class(WARME_OT_create_jlm_curve)
  bpy.utils.register_class(WARME_OT_create_jlt_point)
  bpy.utils.register_class(WARME_OT_create_jlt_spot)


def unregister():
  bpy.utils.unregister_class(WARME_OT_create_jsm)
  bpy.utils.register_class(WARME_OT_cast_to_jsm)


# ----------------------------------------------------------------------------------
# JSM
# ----------------------------------------------------------------------------------
class WARME_OT_create_jsm(bpy.types.Operator):
  """Create JSM""" 
  bl_idname = "object.create_jsm"
  bl_label = "Static Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cube_add()
    cube = context.active_object
    cube.name = "StaticMesh"
    cube.color = (0.6, 0.65, 0.7, 1)

    collection = utils.get_or_create_collection("JSM")
    utils.unlink_from_all_collections(cube)
    collection.objects.link(cube)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_jsm(bpy.types.Operator):
  """Cast To JSM""" 
  bl_idname = "object.cast_to_jsm"
  bl_label = "To Static Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("JSM")

    for object in bpy.context.selected_objects:
      object.color = (0.6, 0.65, 0.7, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}
  
# ----------------------------------------------------------------------------------
# OBJ
# ----------------------------------------------------------------------------------
class WARME_OT_create_obj(bpy.types.Operator):
  """Create OBJ""" 
  bl_idname = "object.create_obj"
  bl_label = "OBJ"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cube_add()
    cube = context.active_object
    cube.name = "Object"
    cube.color = (0.6, 0.65, 0.7, 1)

    collection = utils.get_or_create_collection("OBJ")
    utils.unlink_from_all_collections(cube)
    collection.objects.link(cube)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_obj(bpy.types.Operator):
  """Cast To OBJ""" 
  bl_idname = "object.cast_to_obj"
  bl_label = "To OBJ"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("OBJ")

    for object in bpy.context.selected_objects:
      object.color = (0.6, 0.65, 0.7, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JAM
# ----------------------------------------------------------------------------------
class WARME_OT_create_jam(bpy.types.Operator):
  """Create JAM""" 
  bl_idname = "object.create_jam"
  bl_label = "Animated Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cube_add()
    cube = context.active_object
    cube.name = "AnimatedMesh"
    cube.color = (0.3, 0.8, 0.4, 1)

    collection = utils.get_or_create_collection("JAM")
    utils.unlink_from_all_collections(cube)
    collection.objects.link(cube)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_jam(bpy.types.Operator):
  """Cast To JAM""" 
  bl_idname = "object.cast_to_jam"
  bl_label = "To Animated Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("JAM")

    for object in bpy.context.selected_objects:
      object.color = (0.3, 0.8, 0.4, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JWM
# ----------------------------------------------------------------------------------
class WARME_OT_create_jwm(bpy.types.Operator):
  """Create JWM""" 
  bl_idname = "object.create_jwm"
  bl_label = "Walk Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_plane_add()
    plane = context.active_object
    plane.name = "WalkMesh"
    plane.color = (0.2, 0.7, 1.0, 1)

    collection = utils.get_or_create_collection("JWM")
    utils.unlink_from_all_collections(plane)
    collection.objects.link(plane)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_jwm(bpy.types.Operator):
  """Cast To JWM""" 
  bl_idname = "object.cast_to_jwm"
  bl_label = "To Walk Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("JWM")

    for object in bpy.context.selected_objects:
      object.color = (0.2, 0.7, 1.0, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JNM
# ----------------------------------------------------------------------------------
class WARME_OT_create_jnm(bpy.types.Operator):
  """Create JNM""" 
  bl_idname = "object.create_jnm"
  bl_label = "Hit Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_plane_add()
    plane = context.active_object
    plane.name = "HitMesh"
    plane.color = (1.0, 0.2, 0.2, 1)

    collection = utils.get_or_create_collection("JNM")
    utils.unlink_from_all_collections(plane)
    collection.objects.link(plane)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_jnm(bpy.types.Operator):
  """Cast To JNM""" 
  bl_idname = "object.cast_to_jnm"
  bl_label = "To Hit Mesh"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("JNM")

    for object in bpy.context.selected_objects:
      object.color = (1.0, 0.2, 0.2, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JSV
# ----------------------------------------------------------------------------------
class WARME_OT_create_jsv(bpy.types.Operator):
  """Create JSV""" 
  bl_idname = "object.create_jsv"
  bl_label = "Shadow Volume"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cube_add()
    cube = context.active_object
    cube.name = "ShadowVolume"
    cube.color = (0.1, 0.05, 0.2, 1)

    collection = utils.get_or_create_collection("JSV")
    utils.unlink_from_all_collections(cube)
    collection.objects.link(cube)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_jsv(bpy.types.Operator):
  """Cast To JSV""" 
  bl_idname = "object.cast_to_jsv"
  bl_label = "To Shadow Volume"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("JSV")

    for object in bpy.context.selected_objects:
      object.color = (0.1, 0.05, 0.2, 1)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# GRF
# ----------------------------------------------------------------------------------
class WARME_OT_create_grf(bpy.types.Operator):
  """Create GRF""" 
  bl_idname = "object.create_grf"
  bl_label = "Graph Node"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_plane_add()
    plane = context.active_object
    plane.name = "Graph"
    plane.color = (1.0, 0.85, 0.2, 1)
    utils.triangulate_mesh(plane)

    collection = utils.get_or_create_collection("GRF")
    utils.unlink_from_all_collections(plane)
    collection.objects.link(plane)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_cast_to_grf(bpy.types.Operator):
  """Cast To GRF""" 
  bl_idname = "object.cast_to_grf"
  bl_label = "To Graph Node"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    collection = utils.get_or_create_collection("GRF")

    for object in bpy.context.selected_objects:
      object.color = (1.0, 0.85, 0.2, 1)
      utils.triangulate_mesh(object)
      utils.unlink_from_all_collections(object)
      collection.objects.link(object)
      self.report({'INFO'}, "Cast successful ✔")
    #endfor

    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JLM
# ----------------------------------------------------------------------------------
class WARME_OT_create_jlm_points(bpy.types.Operator):
  """Create JLM Points""" 
  bl_idname = "object.create_jlm_points"
  bl_label = "Line Points"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    mesh = bpy.data.meshes.new("LineMesh")
    obj = bpy.data.objects.new("LineObject", mesh)
    obj.name = "LinePoints"
    obj.color = (1.0, 0.3, 0.7, 1)

    bm = bmesh.new()
    v1 = bm.verts.new((0, 0, 0))
    v2 = bm.verts.new((2, 0, 0))
    bm.edges.new((v1, v2))
    bm.to_mesh(mesh)
    bm.free()

    collection = utils.get_or_create_collection("JLM")
    utils.unlink_from_all_collections(obj)
    collection.objects.link(obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_jlm_curve(bpy.types.Operator):
  """Create JLM Curve""" 
  bl_idname = "object.create_jlm_curve"
  bl_label = "Line Curve"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.curve.primitive_nurbs_path_add()
    obj = context.active_object
    obj.name = "CatmullRomPath"
    obj.color = (1.0, 0.3, 0.7, 1)

    group = bpy.data.node_groups.new(name="MonNoeudSpline", type='GeometryNodeTree')
    group.interface.new_socket(name="Geometry", in_out='INPUT', socket_type='NodeSocketGeometry')
    group.interface.new_socket(name="Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = group.nodes
    input_node = nodes.new(type='NodeGroupInput')
    output_node = nodes.new(type='NodeGroupOutput')
    spline_node = nodes.new(type='GeometryNodeCurveSplineType')
    spline_node.spline_type = 'CATMULL_ROM'

    links = group.links
    links.new(input_node.outputs['Geometry'], spline_node.inputs['Curve']) # Input -> Set Spline Type
    links.new(spline_node.outputs['Curve'], output_node.inputs['Geometry'])

    modifier = obj.modifiers.new(name="CatmullRomGN", type='NODES')
    modifier.node_group = group

    collection = utils.get_or_create_collection("JLM")
    utils.unlink_from_all_collections(obj)
    collection.objects.link(obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# JLT
# ----------------------------------------------------------------------------------
class WARME_OT_create_jlt_point(bpy.types.Operator):
  """Create JLT Point""" 
  bl_idname = "object.create_jlt_point"
  bl_label = "Point Light"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    light_data = bpy.data.lights.new(name="JLT_Point_Data", type='POINT')
    obj = bpy.data.objects.new(name="PointLight", object_data=light_data)

    collection = utils.get_or_create_collection("JLT")
    utils.unlink_from_all_collections(obj)
    collection.objects.link(obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_jlt_spot(bpy.types.Operator):
  """Create JLT Spot""" 
  bl_idname = "object.create_jlt_spot"
  bl_label = "Spot Light"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    light_data = bpy.data.lights.new(name="JLT_Spot_Data", type='SPOT')
    obj = bpy.data.objects.new(name="SpotLight", object_data=light_data)

    collection = utils.get_or_create_collection("JLT")
    utils.unlink_from_all_collections(obj)
    collection.objects.link(obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}