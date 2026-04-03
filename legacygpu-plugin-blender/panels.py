import bpy
from . import utils
# ----------------------------------------------------------------------------------


def register():
  bpy.utils.register_class(WARME_PT_options)
  bpy.utils.register_class(WARME_PT_object)


def unregister():
  bpy.utils.unregister_class(WARME_PT_options)
  bpy.utils.unregister_class(WARME_PT_object)


class WARME_PT_options(bpy.types.Panel):
  bl_idname = "WARME_PT_options"
  bl_label = "LGPU Exporter"
  bl_space_type = 'VIEW_3D'
  bl_region_type = 'UI'
  bl_category = "LGPU Exporter"
  bl_context = "objectmode"

  def draw(self, context):
    layout = self.layout.column()
    layout.label(text=f"Export path: {bpy.path.abspath(context.scene.render.filepath)}")
    layout.separator()
    layout.operator("object.export_pack")
    layout.operator("object.export_objects")
    layout.operator("object.export_world")
    layout.separator()
    layout.prop(context.scene.world_properties, "enable_auto_export")
    layout.prop(context.scene.world_properties, "enable_export_has_binary")

    # START CREATE
    box, opened = utils.draw_foldout(layout, context.scene.world_properties, "show_create", "Create", 'ADD')
    if opened:
      utils.draw_title_row(layout, "--- Meshes ---")
      layout.operator("object.create_jsm")
      layout.operator("object.create_obj")
      layout.operator("object.create_jam")
      layout.operator("object.create_jwm")
      layout.operator("object.create_jnm")
      layout.operator("object.create_jsv")
      layout.operator("object.create_grf")

      utils.draw_title_row(layout, "--- Lines & Curves ---")
      layout.operator("object.create_jlm_points")
      layout.operator("object.create_jlm_curve")

      utils.draw_title_row(layout, "--- Lights ---")
      layout.operator("object.create_jlt_point")
      layout.operator("object.create_jlt_spot")

      utils.draw_title_row(layout, "--- Specials ---")
      
      layout.separator()
    #endif

    # START CAST
    box, opened = utils.draw_foldout(layout, context.scene.world_properties, "show_cast_to", "Cast To", 'ARROW_LEFTRIGHT')
    if opened:
      utils.draw_title_row(layout, "--- Meshes ---")
      layout.operator("object.cast_to_jsm")
      layout.operator("object.cast_to_obj")
      layout.operator("object.cast_to_jam")
      layout.operator("object.cast_to_jwm")
      layout.operator("object.cast_to_jnm")
      layout.operator("object.cast_to_jsv")
      layout.operator("object.cast_to_grf")
    # END CAST

    # START CAMERA
    box, opened = utils.draw_foldout(layout, context.scene.world_properties, "show_camera", "Camera", 'CAMERA_DATA')
    if opened:
      layout.prop(context.scene.world_properties, "camera_projection_type_bind")
      layout.prop(context.scene.world_properties, "camera_fovy_bind")
      layout.prop(context.scene.world_properties, "camera_near_bind")
      layout.prop(context.scene.world_properties, "camera_far_bind")
      layout.prop(context.scene.world_properties, "camera_ortho_size_bind")
      layout.prop(context.scene.world_properties, "camera_clip_offset")
      layout.prop(context.scene.world_properties, "camera_min_clip_offset")
      layout.prop(context.scene.world_properties, "camera_max_clip_offset")
      layout.prop(context.scene.world_properties, "camera_matrix_export_enabled")
    # END CAMERA

    # START WORLD
    box, opened = utils.draw_foldout(layout, context.scene.world_properties, "show_world", "World", 'WORLD')
    if opened:
      utils.draw_title_row(layout, "--- Shadow ---")
      layout.prop(context.scene.world_properties, "shadow_enabled")
      utils.draw_input_row(layout, context.scene.world_properties, "shadow_position", "Shadow Position")
      utils.draw_input_row(layout, context.scene.world_properties, "shadow_target", "Shadow Target")
      layout.prop(context.scene.world_properties, "shadow_size")
      layout.prop(context.scene.world_properties, "shadow_depth")
      utils.draw_title_row(layout, "--- Fog ---")
      layout.prop(context.scene.world_properties, "fog_enabled")
      layout.prop(context.scene.world_properties, "fog_near")
      layout.prop(context.scene.world_properties, "fog_far")
      utils.draw_input_row(layout, context.scene.world_properties, "fog_color", "Fog Color")
      utils.draw_title_row(layout, "--- Ambient Color ---")
      utils.draw_input_row(layout, context.scene.world_properties, "ambient", "Ambient Color")
      utils.draw_title_row(layout, "--- Decal Atlas ---")
      utils.draw_input_row(layout, context.scene.world_properties, "decal_atlas", "Decal Atlas")
      utils.draw_title_row(layout, "--- Custom Params ---")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s00_name", text="")
      row.prop(context.scene.world_properties, "world_s00_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s01_name", text="")
      row.prop(context.scene.world_properties, "world_s01_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s02_name", text="")
      row.prop(context.scene.world_properties, "world_s02_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s03_name", text="")
      row.prop(context.scene.world_properties, "world_s03_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s04_name", text="")
      row.prop(context.scene.world_properties, "world_s04_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s05_name", text="")
      row.prop(context.scene.world_properties, "world_s05_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s06_name", text="")
      row.prop(context.scene.world_properties, "world_s06_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s07_name", text="")
      row.prop(context.scene.world_properties, "world_s07_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s08_name", text="")
      row.prop(context.scene.world_properties, "world_s08_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s09_name", text="")
      row.prop(context.scene.world_properties, "world_s09_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s10_name", text="")
      row.prop(context.scene.world_properties, "world_s10_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s11_name", text="")
      row.prop(context.scene.world_properties, "world_s11_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s12_name", text="")
      row.prop(context.scene.world_properties, "world_s12_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s13_name", text="")
      row.prop(context.scene.world_properties, "world_s13_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s14_name", text="")
      row.prop(context.scene.world_properties, "world_s14_value", text="")
      row = layout.row()
      row.prop(context.scene.world_properties, "world_s15_name", text="")
      row.prop(context.scene.world_properties, "world_s15_value", text="")
    # END WORLD


class WARME_PT_object(bpy.types.Panel):
  bl_idname = "WARME_PT_object"
  bl_label = "LGPU Object Panel"
  bl_space_type = 'VIEW_3D'
  bl_region_type = 'UI'
  bl_category = "LGPU Object Panel"
  bl_context = "objectmode"

  def draw(self, context):
    selected = bpy.context.selected_objects
    layout = self.layout.column()    
    layout.separator()

    # START SUN
    if selected and len(selected) == 1 and utils.belong_to_collection(bpy.context.selected_objects[0], "SUN"):
      selected_object = bpy.context.selected_objects[0]
      utils.draw_input_row(layout, selected_object.sun_properties, "sun_diffuse", "Sun Diffuse")
      utils.draw_input_row(layout, selected_object.sun_properties, "sun_specular", "Sun Specular")
      layout.prop(selected_object.sun_properties, "sun_intensity")
      layout.prop(selected_object.sun_properties, "sun_light_group_id")
    # END SUN

    # START LIGHT
    if selected and len(selected) == 1 and selected[0].type == 'LIGHT':
      selected_object = bpy.context.selected_objects[0]
      layout = self.layout.column()
      utils.draw_input_row(layout, selected_object.light_properties, "diffuse", "Diffuse")
      utils.draw_input_row(layout, selected_object.light_properties, "specular", "Specular")
      layout.prop(selected_object.light_properties, "intensity")
      layout.prop(selected_object.light_properties, "constant")
      layout.prop(selected_object.light_properties, "linear")
      layout.prop(selected_object.light_properties, "exp")
      layout.prop(selected_object.light_properties, "group_id")
      layout.prop(selected_object.light_properties, "spot_cutoff_angle")
    # END LIGHT

    # START MESH
    if selected and len(selected) == 1 and selected[0].type == 'MESH':
      selected_object = bpy.context.selected_objects[0]
      layout = self.layout.column()

      # START TRANSFORM
      if bpy.context.selected_objects and bpy.context.selected_objects[0]:
        selected_object = bpy.context.selected_objects[0]
        box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_transform_infos", "Transform Informations", 'PREFERENCES')
        if opened:
          pos = utils.get_position_of_object(bpy.context.selected_objects[0])
          utils.draw_title_row(layout, "--- Position ---")
          layout.label(text=f"X: {pos[0]:.3f}")
          layout.label(text=f"Y: {pos[1]:.3f}")
          layout.label(text=f"Z: {pos[2]:.3f}")

          rot = utils.get_rotation_of_object(bpy.context.selected_objects[0])
          utils.draw_title_row(layout, "--- Rotation ---")
          layout.label(text=f"X: {rot[0]:.3f}")
          layout.label(text=f"Y: {rot[1]:.3f}")
          layout.label(text=f"Z: {rot[2]:.3f}")
          layout.separator()
          layout.operator("object.copy_object_position")
          layout.operator("object.copy_object_rotation")
          layout.operator("object.copy_camera_matrix")
        #endif
      # END TRANSFORM

      # START ANIMATIONS
      if bpy.context.selected_objects and bpy.context.selected_objects[0] and utils.belong_to_collection(bpy.context.selected_objects[0], "JAM"):
        box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_animation", "Animation Frames", 'PREFERENCES')
        if opened:
          layout = self.layout.column()
          layout.operator("object.add_animation")
          layout.operator("object.remove_animation")
          layout.separator(type="LINE")
          # Row for each animation
          for i, anim in enumerate(context.object.jam_animations):
            utils.draw_input_row(layout, context.object.jam_animations[i], "name", "Name")
            utils.draw_input_row(layout, context.object.jam_animations[i], "start_frame", "Start Frame")
            utils.draw_input_row(layout, context.object.jam_animations[i], "end_frame", "End Frame")
            utils.draw_input_row(layout, context.object.jam_animations[i], "frame_duration", "Frame Duration")
            layout.separator(type="LINE")
          #endfor
        #endif
      # END ANIMATIONS

      # GENERAL
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_general", "General", 'PREFERENCES')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "id", "Id")
        utils.draw_input_row(layout, selected_object.mat_properties, "opacity", "Opacity")

      # SHADOW
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_shadow", "Shadow", 'NORMALS_FACE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "shadow_enabled", "Shadow Enabled")

      # DECALS
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_decals", "Decals", 'STICKY_UVS_DISABLE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "decal_enabled", "Enable Decal")
        utils.draw_input_row(layout, selected_object.mat_properties, "decal_group", "Decal Group Identifier")

      # LIGHT
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_light", "Light", 'LIGHT')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "light_enabled", "Light Enabled")
        utils.draw_input_row(layout, selected_object.mat_properties, "light_group", "Light Group identifier")
        utils.draw_input_row(layout, selected_object.mat_properties, "light_gouraud_shading_enabled", "Light Gouraud Shading Enabled")

      # SAMPLER
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_sampler", "Sampler", 'IMAGE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_enabled", "Enabled")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_address_mode_u", "Address Mode U")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_address_mode_v", "Address Mode V")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_address_mode_w", "Address Mode W")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_mag_filter", "Mag Filter")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_min_filter", "Min Filter")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_mipmap_filter", "MipMap Filter")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_lod_min_clamp", "Lod Min Clamp")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_lod_max_clamp", "Lod Max Clamp")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_max_anisotropy", "Max Anisotropy")
        utils.draw_input_row(layout, selected_object.mat_properties, "sampler_type", "Type")

      # TEXTURE
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_texture", "Texture", 'PREFERENCES')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "texture", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_scroll_angle", "Scroll Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_scroll_rate", "Scroll Rate")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_offset", "Offset X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_offset", "Offset Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_scale", "Scale X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_scale", "Scale Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_rotation_angle", "Rotation Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_opacity", "Opacity")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_blend_color", "Blend Color")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_blend_color_mode", "Blend Color Mode")
        utils.draw_input_row(layout, selected_object.mat_properties, "texture_blend_color_mix", "Blend Color Mix")

      # SECONDARY TEXTURE
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_secondary_texture", "Secondary Texture", 'TEXTURE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_scroll_angle", "Scroll Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_scroll_rate", "Scroll Rate")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_offset", "Offset X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_offset", "Offset Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_scale", "Scale X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_scale", "Scale Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_rotation_angle", "Rotation Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_opacity", "Opacity")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_blend_mode", "Texture Blending Mode")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_blend_color", "Blend Color")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_blend_color_mode", "Blend Color Mode")
        utils.draw_input_row(layout, selected_object.mat_properties, "secondary_texture_blend_color_mix", "Blend Color Mix")

      # ENV MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_env_map", "Env Map", 'WORLD')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_right", "Right")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_left", "Left")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_top", "Top")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_bottom", "Bottom")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_front", "Front")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_back", "Back")
        utils.draw_input_row(layout, selected_object.mat_properties, "env_map_opacity", "Opacity")

      # NORMAL MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_normal_map", "Normal Map", 'NORMALS_FACE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_scroll_angle", "Scroll Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_scroll_rate", "Scroll Rate")
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_offset", "Offset X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_offset", "Offset Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_scale", "Scale X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_scale", "Scale Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_rotation_angle", "Rotation Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "normal_map_intensity", "Intensity")

      # DISPLACEMENT MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_displacement_map", "Displacement Map", 'MOD_DISPLACE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_scroll_angle", "Scroll Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_scroll_rate", "Scroll Rate")
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_offset", "Offset X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_offset", "Offset Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_scale", "Scale X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_scale", "Scale Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_rotation_angle", "Rotation Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "displacement_map_factor", "Displacement Pixel Factor")
        utils.draw_input_row(layout, selected_object.mat_properties, "displace_texture", "Texture Albedo")
        utils.draw_input_row(layout, selected_object.mat_properties, "displace_secondary_texture", "Secondary Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "displace_normal_map", "Normal Map")
        utils.draw_input_row(layout, selected_object.mat_properties, "displace_dissolve_map", "Dissolve Map")
        utils.draw_input_row(layout, selected_object.mat_properties, "displace_env_map", "Env Map")

      # DISSOLVE MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_dissolve_map", "Dissolve Map", 'MOD_MASK')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_scroll_angle", "Scroll Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_scroll_rate", "Scroll Rate")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_offset", "Offset X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_offset", "Offset Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_scale", "Scale X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_scale", "Scale Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_map_rotation_angle", "Rotation Angle")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_glow", "Glow Color")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_glow_range", "Glow Range")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_glow_falloff", "Glow Fallof")
        utils.draw_input_row(layout, selected_object.mat_properties, "dissolve_amount", "Dissolve Amount")

      # TOON MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_toon_map", "Toon Map", 'OUTLINER_OB_LIGHT')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "toon_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "toon_map_opacity", "Opacity")
        utils.draw_input_row(layout, selected_object.mat_properties, "toon_light_dir", "Light Direction X", 0)
        utils.draw_input_row(layout, selected_object.mat_properties, "toon_light_dir", "Light Direction Y", 1)
        utils.draw_input_row(layout, selected_object.mat_properties, "toon_light_dir", "Light Direction Z", 2)

      # EMISSIVE MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_emissive_map", "Emissive Map", 'LIGHT_DATA')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "emissive_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "emissive_factor", "Strength Factor")
        utils.draw_input_row(layout, selected_object.mat_properties, "emissive", "Color")

      # AMBIENT
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_ambient", "Ambient", 'LIGHT_DATA')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "ambient", "Color")

      # DIFFUSE MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_diffuse_map", "Diffuse Map", 'IMAGE')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "diffuse_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "diffuse", "Color")

      # SPECULAR MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_specular_map", "Specular Map", 'SHADING_RENDERED')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "specular_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "specular_map_factor", "Strength Factor")
        utils.draw_input_row(layout, selected_object.mat_properties, "specular", "Color")

      # THUNE MAP
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_thune_map", "Thune Map", 'SHADING_RENDERED')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "thune_map", "Texture")
        utils.draw_input_row(layout, selected_object.mat_properties, "thune_map_shininess_enabled", "Shininess (R)")
        utils.draw_input_row(layout, selected_object.mat_properties, "thune_map_arcade_enabled", "Arcade (G)")
        utils.draw_input_row(layout, selected_object.mat_properties, "thune_map_reflective_enabled", "Reflective (B)")

      # ALPHA BLEND
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_alpha_blend", "Alpha Blend", 'MOD_UVPROJECT')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "alpha_blend_facing", "Alpha Blend Facing")
        utils.draw_input_row(layout, selected_object.mat_properties, "alpha_blend_distance", "Alpha Blend Distance")

      # JITTER VERTEX
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_jitter_vertex", "Jitter Vertex", 'PLAY')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "jitter_vertex_enabled", "Enable")
        utils.draw_input_row(layout, selected_object.mat_properties, "jitter_vertex_level", "Strenght Level")

      # ARCADE
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_arcade", "Arcade Shading", 'MOD_UVPROJECT')
      if opened:
        utils.draw_input_row(layout, selected_object.mat_properties, "arcade_enabled", "Enable")
        utils.draw_input_row(layout, selected_object.mat_properties, "arcade_start_color", "Start Front Color")
        utils.draw_input_row(layout, selected_object.mat_properties, "arcade_end_color", "End Front Color")
        utils.draw_input_row(layout, selected_object.mat_properties, "arcade_sharp_color", "Sharp Color")

      # FLIPBOOK
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_flipbook", "Flipbook", 'SEQ_SEQUENCER')
      if opened:
        layout.separator()
        layout.operator("object.material_add_animation")
        layout.operator("object.material_remove_animation")
        layout.separator(type="LINE")
        # Row for each animation
        for i, anim in enumerate(context.object.material_animations):
          col = layout.column()
          row1 = col.row()
          utils.draw_input_row(col, context.object.material_animations[i], "texture_target", "Texture Target")
          utils.draw_input_row(col, context.object.material_animations[i], "frame_width", "Frame Width")
          utils.draw_input_row(col, context.object.material_animations[i], "frame_height", "Frame Height")
          utils.draw_input_row(col, context.object.material_animations[i], "frame_duration", "Frame Duration")
          utils.draw_input_row(col, context.object.material_animations[i], "num_col", "Num Col")
          utils.draw_input_row(col, context.object.material_animations[i], "num_row", "Num Row")
          utils.draw_input_row(col, context.object.material_animations[i], "num_frames", "Num Frames")
          layout.separator(type="LINE")
        #endfor

      # CUSTOM PARAMS
      box, opened = utils.draw_foldout(layout, selected_object.mat_properties, "show_custom_params", "Custom Params", 'RNA')
      if opened:
        row = layout.row()
        row.prop(selected_object.mat_properties, "s00_name", text="")
        row.prop(selected_object.mat_properties, "s00_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s01_name", text="")
        row.prop(selected_object.mat_properties, "s01_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s02_name", text="")
        row.prop(selected_object.mat_properties, "s02_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s03_name", text="")
        row.prop(selected_object.mat_properties, "s03_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s04_name", text="")
        row.prop(selected_object.mat_properties, "s04_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s05_name", text="")
        row.prop(selected_object.mat_properties, "s05_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s06_name", text="")
        row.prop(selected_object.mat_properties, "s06_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s07_name", text="")
        row.prop(selected_object.mat_properties, "s07_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s08_name", text="")
        row.prop(selected_object.mat_properties, "s08_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s09_name", text="")
        row.prop(selected_object.mat_properties, "s09_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s10_name", text="")
        row.prop(selected_object.mat_properties, "s10_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s11_name", text="")
        row.prop(selected_object.mat_properties, "s11_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s12_name", text="")
        row.prop(selected_object.mat_properties, "s12_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s13_name", text="")
        row.prop(selected_object.mat_properties, "s13_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s14_name", text="")
        row.prop(selected_object.mat_properties, "s14_value", text="")
        row = layout.row()
        row.prop(selected_object.mat_properties, "s15_name", text="")
        row.prop(selected_object.mat_properties, "s15_value", text="")
        layout.separator()
        row = layout.row()
        utils.draw_input_row(row, selected_object.mat_properties, "s0_texture", "Texture S0")
        row = layout.row()
        utils.draw_input_row(row, selected_object.mat_properties, "s1_texture", "Texture S1")
      #endif
    # END MESH