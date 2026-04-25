import bpy
import bmesh
import math
from . import functions
from . import utils
# ----------------------------------------------------------------------------------


def register():
  bpy.utils.register_class(WARME_OT_create_jsm)
  bpy.utils.register_class(WARME_OT_cast_to_jsm)
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
  bpy.utils.register_class(WARME_OT_create_special_dcl)
  bpy.utils.register_class(WARME_OT_create_special_sun)
  bpy.utils.register_class(WARME_OT_create_special_shadow_projector)
  bpy.utils.register_class(WARME_OT_create_special_shadow_projector_target)
  bpy.utils.register_class(WARME_OT_create_special_skybox)
  bpy.utils.register_class(WARME_OT_create_special_particles)
  bpy.utils.register_class(WARME_OT_create_entity_aabb)
  bpy.utils.register_class(WARME_OT_create_entity_cylinder)
  bpy.utils.register_class(WARME_OT_create_entity_sphere)


def unregister():
  bpy.utils.unregister_class(WARME_OT_create_jsm)
  bpy.utils.unregister_class(WARME_OT_cast_to_jsm)
  bpy.utils.unregister_class(WARME_OT_create_jam)
  bpy.utils.unregister_class(WARME_OT_cast_to_jam)
  bpy.utils.unregister_class(WARME_OT_create_jwm)
  bpy.utils.unregister_class(WARME_OT_cast_to_jwm)
  bpy.utils.unregister_class(WARME_OT_create_jnm)
  bpy.utils.unregister_class(WARME_OT_cast_to_jnm)
  bpy.utils.unregister_class(WARME_OT_create_jsv)
  bpy.utils.unregister_class(WARME_OT_cast_to_jsv)
  bpy.utils.unregister_class(WARME_OT_create_grf)
  bpy.utils.unregister_class(WARME_OT_cast_to_grf)
  bpy.utils.unregister_class(WARME_OT_create_jlm_points)
  bpy.utils.unregister_class(WARME_OT_create_jlm_curve)
  bpy.utils.unregister_class(WARME_OT_create_jlt_point)
  bpy.utils.unregister_class(WARME_OT_create_jlt_spot)
  bpy.utils.unregister_class(WARME_OT_create_special_dcl)
  bpy.utils.unregister_class(WARME_OT_create_special_sun)
  bpy.utils.unregister_class(WARME_OT_create_special_shadow_projector)
  bpy.utils.unregister_class(WARME_OT_create_special_shadow_projector_target)
  bpy.utils.unregister_class(WARME_OT_create_special_skybox)
  bpy.utils.unregister_class(WARME_OT_create_special_particles)
  bpy.utils.unregister_class(WARME_OT_create_entity_aabb)
  bpy.utils.unregister_class(WARME_OT_create_entity_cylinder)
  bpy.utils.unregister_class(WARME_OT_create_entity_sphere)


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


# ----------------------------------------------------------------------------------
# SPECIAL
# ----------------------------------------------------------------------------------
class WARME_OT_create_special_dcl(bpy.types.Operator):
  """Create Decal""" 
  bl_idname = "object.create_special_dcl"
  bl_label = "Decal"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    empty_obj = bpy.data.objects.new("Decal", None)
    collection = utils.get_or_create_collection("DCL")
    utils.unlink_from_all_collections(empty_obj)
    collection.objects.link(empty_obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_special_sun(bpy.types.Operator):
  """Create Sun""" 
  bl_idname = "object.create_special_sun"
  bl_label = "Sun"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    empty_obj = bpy.data.objects.new("Sun", None)
    empty_obj.empty_display_type = 'SINGLE_ARROW'
    empty_obj.empty_display_size = 4.0
    collection = utils.get_or_create_collection("Collection")
    utils.unlink_from_all_collections(empty_obj)
    collection.objects.link(empty_obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_special_shadow_projector(bpy.types.Operator):
  """Create Shadow Projector""" 
  bl_idname = "object.create_special_shadow_projector"
  bl_label = "Shadow Projector"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    empty_obj = bpy.data.objects.new("ShadowProjector", None)
    empty_obj.empty_display_type = 'CUBE'
    collection = utils.get_or_create_collection("Collection")
    utils.unlink_from_all_collections(empty_obj)
    collection.objects.link(empty_obj)
    utils.setup_tracking("ShadowProjector", "ShadowProjectorTarget")

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_special_shadow_projector_target(bpy.types.Operator):
  """Create Shadow Projector Target""" 
  bl_idname = "object.create_special_shadow_projector_target"
  bl_label = "Shadow Projector Target"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    empty_obj = bpy.data.objects.new("ShadowProjectorTarget", None)
    empty_obj.empty_display_type = 'CONE'
    empty_obj.empty_display_size = 0.1
    empty_obj.rotation_euler[0] = math.radians(90)

    collection = utils.get_or_create_collection("Collection")
    utils.unlink_from_all_collections(empty_obj)
    collection.objects.link(empty_obj)
    utils.setup_tracking("ShadowProjector", "ShadowProjectorTarget")

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_special_skybox(bpy.types.Operator):
  """Create Skybox""" 
  bl_idname = "object.create_special_skybox"
  bl_label = "Skybox"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    empty_obj = bpy.data.objects.new("Skybox", None)
    empty_obj.empty_display_type = 'CUBE'
    empty_obj.empty_display_size = 600

    collection = utils.get_or_create_collection("SKY")
    utils.unlink_from_all_collections(empty_obj)
    collection.objects.link(empty_obj)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_special_particles(bpy.types.Operator):
  """Create Particles""" 
  bl_idname = "object.create_special_particles"
  bl_label = "Particles"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cone_add()
    particles = context.active_object
    particles.name = "Particles"
    particles.color = (0.0, 1.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("PRT")
    utils.unlink_from_all_collections(particles)
    collection.objects.link(particles)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


# ----------------------------------------------------------------------------------
# ENTITIES
# ----------------------------------------------------------------------------------
class WARME_OT_create_entity_aabb(bpy.types.Operator):
  """Create Entity AABB""" 
  bl_idname = "object.create_entity_aabb"
  bl_label = "Entity AABB"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cube_add()
    cube = context.active_object
    cube.name = "Entity"
    cube["entity_shape"] = "AABB"
    cube.color = (1.0, 0.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("ENT")
    utils.unlink_from_all_collections(cube)
    collection.objects.link(cube)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_entity_cylinder(bpy.types.Operator):
  """Create Entity Cylinder""" 
  bl_idname = "object.create_entity_cylinder"
  bl_label = "Entity Cylinder"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_cylinder_add()
    cylinder = context.active_object
    cylinder.name = "Entity"
    cylinder["entity_shape"] = "CYLINDER"
    cylinder.color = (1.0, 0.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("ENT")
    utils.unlink_from_all_collections(cylinder)
    collection.objects.link(cylinder)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_entity_sphere(bpy.types.Operator):
  """Create Entity Sphere""" 
  bl_idname = "object.create_entity_sphere"
  bl_label = "Entity Sphere"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_uv_sphere_add()
    sphere = context.active_object
    sphere.name = "Entity"
    sphere["entity_shape"] = "SPHERE"
    sphere.color = (1.0, 0.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("ENT")
    utils.unlink_from_all_collections(sphere)
    collection.objects.link(sphere)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_entity_circle(bpy.types.Operator):
  """Create Entity Circle""" 
  bl_idname = "object.create_entity_circle"
  bl_label = "Entity Circle"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_circle_add()
    circle = context.active_object
    circle.name = "Entity"
    circle["entity_shape"] = "CIRCLE"
    circle.color = (1.0, 0.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("ENT")
    utils.unlink_from_all_collections(circle)
    collection.objects.link(circle)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}


class WARME_OT_create_entity_circle(bpy.types.Operator):
  """Create Entity Plane""" 
  bl_idname = "object.create_entity_plane"
  bl_label = "Entity Plane"
  bl_options = {'REGISTER', 'UNDO_GROUPED'}

  def execute(self, context):
    bpy.ops.mesh.primitive_plane_add()
    plane = context.active_object
    plane.name = "Entity"
    plane["entity_shape"] = "PLANE"
    plane.color = (1.0, 0.0, 0.0, 0.2)

    collection = utils.get_or_create_collection("ENT")
    utils.unlink_from_all_collections(plane)
    collection.objects.link(plane)

    self.report({'INFO'}, "Creation successful ✔")
    return {"FINISHED"}