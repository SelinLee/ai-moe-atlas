"""Blender 4.3 stylized 3D bust, based on the licensed Deep Whale Maid portrait.
New procedural adaptation. Side/back volumes are inferred, not canonical.
CC BY-NC-SA 4.0; see adjacent model manifest/NOTICE for the attribution chain.
"""
import bpy, math, os
from math import sin,cos,pi,sqrt
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'public/models/deep-whale-maid/v0.1.0')
REVIEW=os.environ.get('ATLAS_MODEL_REVIEW_DIR',os.path.join(ROOT,'artifacts/models/deep-whale-maid'))
os.makedirs(OUT,exist_ok=True);os.makedirs(REVIEW,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for m in bpy.data.materials:bpy.data.materials.remove(m)

def mat(n,c,r=.65,metal=0):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=r;p.inputs['Metallic'].default_value=metal;return m
skin=mat('Porcelain skin',(.98,.69,.59));white=mat('Ivory cotton',(.95,.92,.89));navy=mat('Midnight uniform',(.038,.057,.14));hair=mat('Indigo hair',(.032,.055,.16));tips=mat('Blue tips',(.15,.35,.61));shadow=mat('Indigo shadow',(.047,.078,.19));blue=mat('Ocean ribbon',(.11,.33,.62));gold=mat('Gold piping',(.57,.34,.095),.38,.55);black=mat('Ink lashes',(.011,.015,.038));mouth=mat('Mouth',(.29,.045,.064));tongue=mat('Tongue',(.96,.24,.29));blush=mat('Rosy cheeks',(.98,.51,.46));iris=mat('Sapphire iris',(.039,.16,.37));aqua=mat('Aqua iris',(.12,.57,.81));pupil=mat('Deep pupils',(.018,.042,.096));shine=mat('Catchlights',(1,1,1),.2);base=mat('Plinth',(.14,.27,.38));cream=mat('Apron shadows',(.76,.82,.89))
hairgrad=mat('Indigo blue gradient',(.13,.25,.48));p=hairgrad.node_tree.nodes.get('Principled BSDF');v=hairgrad.node_tree.nodes.new('ShaderNodeVertexColor');v.layer_name='Color';hairgrad.node_tree.links.new(v.outputs['Color'],p.inputs['Base Color'])
model=[]
def finish(o,n,m,sub=0):
 o.name=n;o.data.materials.append(m)
 if o.type=='MESH':
  for p in o.data.polygons:p.use_smooth=True
 if sub:q=o.modifiers.new('Smooth surface','SUBSURF');q.levels=sub;q.render_levels=sub
 model.append(o);return o

def uv(n,loc,scale,m,rot=(0,0,0),seg=40,rings=24):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=seg,ring_count=rings,location=loc);o=bpy.context.object;o.scale=scale;o.rotation_euler=rot;return finish(o,n,m)

def mesh(n,vs,fs,m,sub=0):
 d=bpy.data.meshes.new(n);d.from_pydata(vs,[],fs);d.update();o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);return finish(o,n,m,sub)

def curve(n,pts,r,m):
 d=bpy.data.curves.new(n,'CURVE');d.dimensions='3D';d.resolution_u=12;d.bevel_depth=r;d.bevel_resolution=3;s=d.splines.new('BEZIER');s.bezier_points.add(len(pts)-1)
 for p,co in zip(s.bezier_points,pts):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.data.materials.append(m);model.append(o);return o

def bez(pts,t):
 if len(pts)==4:return Vector(pts[0])*(1-t)**3+Vector(pts[1])*3*(1-t)**2*t+Vector(pts[2])*3*(1-t)*t*t+Vector(pts[3])*t**3
 n=len(pts)-1;f=t*n;i=min(int(f),n-1);u=f-i;p1=Vector(pts[i]);p2=Vector(pts[i+1]);p0=Vector(pts[max(0,i-1)]);p3=Vector(pts[min(n,i+2)])
 return .5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)

def lock(n,pts,w,d,m=hairgrad,rings=32,sides=12,pointed=True):
 vs=[];fs=[]
 for i in range(rings+1):
  t=i/rings;c=bez(pts,t);tan=(bez(pts,min(1,t+.002))-bez(pts,max(0,t-.002))).normalized();u=tan.cross(Vector((0,-1,0))).normalized();v=u.cross(tan).normalized();r=(.58+.42*sin(pi*min(1,t*1.7)))*((1-t)**.4 if pointed else 1)
  if i==rings and pointed:r=.003
  for j in range(sides):a=j*2*pi/sides;vs.append(tuple(c+u*cos(a)*w*r+v*sin(a)*d*r))
 for i in range(rings):
  for j in range(sides):a=i*sides+j;b=i*sides+(j+1)%sides;fs.append((a,b,b+sides,a+sides))
 fs += [tuple(range(sides-1,-1,-1)),tuple(rings*sides+j for j in range(sides))];o=mesh(n,vs,fs,m,1)
 if m==hairgrad:
  col=o.data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
  for i,e in enumerate(col.data):
   t=(i//sides)/rings;f=max(0,min(1,(t-.46)/.54))**1.2;a=(.028,.045,.145);b=(.065,.21,.46);e.color=(*(a[k]*(1-f)+b[k]*f for k in range(3)),1)
 return o

# Stage 1. Reference-matched silhouette: bodice, cheek-cupping sleeves, palms.
uv('Uniform bodice',(0,0,.64),(.57,.36,.53),navy);uv('Neck',(0,-.01,1.28),(.20,.19,.30),skin);uv('Apron bib',(0,-.313,.80),(.37,.07,.39),white)
for s in [-1,1]:
 uv('Puffed shoulder',(s*.45,0,1.02),(.28,.29,.29),navy);uv('Resting sleeve',(s*.51,-.15,.58),(.25,.29,.40),navy,(0,s*.24,0));lock('Bent sleeve',[(s*.53,-.17,.48),(s*.72,-.30,.65),(s*.70,-.38,1.06),(s*.60,-.47,1.30)],.19,.20,navy,pointed=False)
 uv('Navy cuff',(s*.60,-.445,1.20),(.215,.205,.18),navy,(0,s*.16,0));curve('Cuff gold piping',[(s*.60+.202*cos(j*2*pi/24),-.445+.193*sin(j*2*pi/24),1.115) for j in range(25)],.014,gold)
 for j in range(9):
  a=j*2*pi/9;uv('Cuff lace',(s*.60+.18*cos(a),-.445+.166*sin(a),1.325),(.075,.065,.09),white,(0,.3*cos(a),a))
 uv('Palm',(s*.57,-.53,1.48),(.145,.10,.18),skin,(0,-s*.45,0))
 for j in range(4):uv('Curled finger',(s*(.50+j*.058),-.545,1.51+.13*sin((j+1)*pi/5)),(.037,.059,.115),skin,(0,-s*.44,0),24,14)
 uv('Thumb',(s*.47,-.59,1.47),(.065,.06,.115),skin,(0,s*.65,0),24,14)
for x in [-.25,-.13,0,.13,.25]:curve('Apron seam',[(x,-.371,.52),(x*.91,-.39,.76),(x*.77,-.354,1.06)],.008,cream)
for z in [.58,.72,.86]:uv('Button',(0,-.401,z),(.035,.018,.035),navy,seg=24,rings=16)
for s in [-1,1]:
 o=mesh('Collar',[(0,-.25,1.20),(s*.30,-.25,1.14),(s*.22,-.375,.96),(.015*s,-.40,1.085)],[(0,1,2,3)],white,2);o.modifiers.new('Fabric thickness','SOLIDIFY').thickness=.024

def bow(n,loc,size,m):
 x,y,z=loc
 for sign in [-1,1]:
  vs=[];fs=[];A=24;B=16
  # Pinched, broad-winged cloth loops with a sculpted central crease.
  for i in range(A+1):
   u=i/A;width=(.035+.145*sin(pi*u*.85))*size;xx=x+sign*(.025+.35*u)*size
   for j in range(B):
    a=j*2*pi/B;zz=z+width*cos(a);yy=y+.026*u*size+.055*sin(a)*size*sin(pi*u)**.6
    vs.append((xx,yy,zz))
  for i in range(A):
   for j in range(B):a=i*B+j;b=i*B+(j+1)%B;fs.append((a,b,b+B,a+B))
  fs.extend([tuple(range(B-1,-1,-1)),tuple(A*B+j for j in range(B))]);mesh(n+' sculpted ribbon loop',vs,fs,m,1)
  # Tapered ribbon ends are distinct cloth pieces.
  pts=[(x+sign*.05*size,y+.02*size,z-.025*size),(x+sign*.13*size,y+.015*size,z-.12*size),(x+sign*.16*size,y+.045*size,z-.27*size)]
  lock(n+' ribbon tail',pts,.068*size,.016*size,m,16,8,False)
 uv(n+' knot',(x,y-.06*size,z),(.065*size,.064*size,.085*size),m)
bow('Neck ribbon',(0,-.405,1.13),.83,navy)
for sz,m,y in [(.081,gold,-.50),(.060,blue,-.519)]:
 o=mesh('Diamond cameo',[(0,y,1.13+sz),(-sz*.75,y,1.13),(0,y,1.13-sz),(sz*.75,y,1.13)],[(0,1,2,3)],m);o.modifiers.new('Depth','SOLIDIFY').thickness=.02
# Stage 2. Sculpted pear-shaped face with volume-following anime eye patches.
vs=[];fs=[];N=64;M=40
for i in range(M+1):
 t=pi*i/M;z=2.135+.78*cos(t);chin=1-.10*max(0,-cos(t))
 for j in range(N):a=j*2*pi/N;vs.append((.805*sin(t)*sin(a)*chin,-.535*sin(t)*cos(a),z))
for i in range(M):
 for j in range(N):a=i*N+j;b=i*N+(j+1)%N;fs.append((a,b,b+N,a+N))
mesh('Sculpted face',vs,fs,skin,1)
def fy(x,z,o=0):return -.535*sqrt(max(.07,1-(x/.805)**2-((z-2.135)/.78)**2))-o

def patch(n,cx,cz,rx,rz,m,o=.02):
 vs=[(cx,fy(cx,cz,o+.004),cz)];fs=[];S=48
 for k in range(1,9):
  r=k/8
  for j in range(S):a=2*pi*j/S;x=cx+rx*r*cos(a);z=cz+rz*r*sin(a);vs.append((x,fy(x,z,o+.004*(1-r*r)),z))
 for j in range(S):fs.append((0,1+j,1+(j+1)%S))
 for k in range(7):
  for j in range(S):a=1+k*S+j;b=1+k*S+(j+1)%S;fs.append((a,a+S,b+S,b))
 o=mesh(n,vs,fs,m);o['facePatch']=True;return o
for s in [-1,1]:
 x=s*.31;z=2.07
 for n,cx,cz,rx,rz,m,o in [('Eye white',x,z,.211,.212,white,.008),('Iris',x,z-.017,.151,.178,iris,.014),('Iris aqua',x,z-.084,.132,.091,aqua,.022),('Pupil',x,z+.005,.047,.100,pupil,.028),('Catchlight',x-s*.047,z+.086,.041,.050,shine,.036),('Eye glint',x+s*.076,z-.063,.019,.023,shine,.037)]:patch(n,cx,cz,rx,rz,m,o)
 pts=[]
 for j in range(15):a=.10*pi+j*.80*pi/14;xx=x+.218*cos(a);zz=z+.220*sin(a);pts.append((xx,fy(xx,zz,.043),zz))
 curve('Upper eyelash',pts,.022,black);curve('Lower eyelash',[(x-.17,fy(x-.17,z-.12,.025),z-.12),(x,fy(x,z-.203,.025),z-.203),(x+.16,fy(x+.16,z-.13,.025),z-.13)],.008,shadow)
 for j in range(3):
  xx=x+s*(.179-j*.022);zz=z+.132+j*.027;lock('Tapered outer lash',[(xx,fy(xx,zz,.05),zz),(xx+s*.055,fy(xx,zz,.05),zz+.005),(xx+s*(.10-j*.015),fy(xx,zz,.05),zz+.04)],.022,.012,black,8,6)
 curve('Eyebrow',[(x-s*.13,fy(x-s*.13,2.409,.025),2.409),(x,fy(x,2.434,.025),2.434),(x+s*.14,fy(x+s*.14,2.440,.025),2.440)],.014,hair)
 patch('Blush',s*.49,1.78,.12,.045,blush,.008)
 for j in range(3):curve('Blush stroke',[(s*(.44+j*.045),fy(s*(.44+j*.045),1.785,.029),1.785),(s*(.45+j*.045),fy(s*(.45+j*.045),1.746,.029),1.746)],.004,tongue)
uv('Small nose',(0,fy(0,1.89,.017),1.89),(.019,.017,.018),skin,seg=20,rings=14)
# The user's expression reference suggests a soft, confident closed omega smile.
smile=[(-.071,1.743),(-.046,1.721),(-.021,1.724),(0,1.738),(.021,1.724),(.046,1.721),(.071,1.743)]
curve('Closed omega smile',[(x,fy(x,z,.015),z) for x,z in smile],.0085,mouth)
# Stage 3. Scalp shell, separately shaped wavy locks, fin ears and sculpted bangs.
vs=[];fs=[]
for i in range(25):
 for j in range(64):a=2*pi*j/64;t=i/24*(1.95-.78*(1+cos(a))/2);vs.append((.847*sin(t)*sin(a),-.584*sin(t)*cos(a)+.025,2.19+.83*cos(t)))
for i in range(24):
 for j in range(64):a=i*64+j;b=i*64+(j+1)%64;fs.append((a,b,b+64,a+64))
mesh('Hair cap',vs,fs,hair,1)
for j in range(11):
 x=-.78+j*.156;y=.29+.24*(1-(x/.85)**2);lock('Back wave %02d'%j,[(x*.80,y*.6,2.54),(x,y,1.86),(x*1.08+.055*sin(j),y+.03,1.22),(x*1.09+.13*sin(j*1.9),y-.01,.69),(x*1.11+.17*sin(j*1.5),y-.07,.47)],.15,.12)
for s in [-1,1]:
 for j in range(4):
  x=.64+j*.075;y=-.04+j*.10;lock('Side wave',[(s*x,y,2.44-j*.09),(s*(.86+j*.04),y-.015,1.76),(s*(.71+j*.09),y-.025,1.08),(s*(.88+j*.10),y-.12,.68),(s*(.70+j*.13),y-.16,.48+j*.04)],.18-j*.013,.115)
 for m,off in [(hair,0),(cream,-.04)]:
  vs=[(s*.70,-.02+off,2.37),(s*.89,-.06+off,2.30),(s*1.08,-.025+off,2.16),(s*1.31,-.035+off,2.12),(s*1.18,-.09+off,2.02),(s*.94,-.14+off,2.055),(s*.76,-.13+off,2.14)]
  if m==cream:vs=[(x,y,z-.047) for x,y,z in vs]
  o=mesh('Whale fin ear',vs,[(0,1,2,3,4,5,6)],m,2);o.modifiers.new('Fin volume','SOLIDIFY').thickness=.075
lock('Central fringe',[(.02,-.37,2.91),(-.10,-.61,2.70),(.17,-.63,2.36),(.08,-.605,2.225)],.26,.09,hair,40)
for s in [-1,1]:
 lock('Parted bang',[(s*.20,-.35,2.91),(s*.48,-.60,2.68),(s*.42,-.60,2.40),(s*.31,-.62,2.29)],.225,.073,hair)
 lock('Outer swept bang',[(s*.40,-.22,2.80),(s*.72,-.44,2.46),(s*.69,-.47,1.87),(s*.55,-.47,1.78)],.22,.09,hair)
 for j in range(2):curve('Hair sculpt ridge',[(s*(.23+j*.09),-.479,2.85),(s*(.40+j*.09),-.649,2.63),(s*(.41+j*.07),-.646,2.44)],.008,shadow)
lock('Swept crown forelock',[(.04,-.02,2.995),(-.14,-.04,3.53),(-.73,-.08,3.36),(-.87,-.10,3.12)],.135,.06,hair,40)
# Stage 4. Pleated maid headband and side ribbon.
curve('Headband',[(.91*cos(j*pi/40),-.10,2.21+.89*sin(j*pi/40)) for j in range(41)],.057,white)
for j in range(15):
 a=.08*pi+j*.84*pi/14;c=Vector((.91*cos(a),-.055,2.21+.93*sin(a)));r=Vector((cos(a),0,sin(a)));t=Vector((-sin(a),0,cos(a)));vs=[]
 for k in range(7):
  f=k/6;w=.07+sin(pi*f)*.032
  for q in [-1,1]:p=c+r*(f*.215)+t*(q*w);p.y+=.025*cos(f*pi)+.022;vs.append(tuple(p))
 o=mesh('Pleated maid lace',vs,[(k*2,k*2+1,k*2+3,k*2+2) for k in range(6)],white,2);o.modifiers.new('Lace thickness','SOLIDIFY').thickness=.025;curve('Lace fold',[tuple(c+r*.035+Vector((0,-.027,0))),tuple(c+r*.15+Vector((0,-.016,0)))],.008,cream)
bow('Side ribbon',(.86,-.12,2.45),.56,blue)
bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=.88,depth=.10,location=(0,.04,.18));o=bpy.context.object;finish(o,'Display plinth',base);b=o.modifiers.new('Soft edge','BEVEL');b.width=.035;b.segments=3
# Preserve material/geometry faithfully in glTF; no lights/cameras in delivered GLB.
bpy.ops.object.select_all(action='DESELECT')
for o in model:o.select_set(True)
bpy.context.view_layer.objects.active=model[0];bpy.ops.object.convert(target='MESH')
for o in bpy.context.selected_objects:
 bpy.context.view_layer.objects.active=o
 for m in list(o.modifiers):
  try:bpy.ops.object.modifier_apply(modifier=m.name)
  except RuntimeError:pass
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
# Coherent outward normals are essential for the same GLB in every web renderer.
import bmesh
for o in bpy.context.selected_objects:
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if o.get('facePatch'):
  if sum(f.normal.y*f.calc_area() for f in bm.faces)>0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 elif all(e.is_manifold for e in bm.edges) and bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(o.data);bm.free();o.data.update()

# Join geometry while retaining material groups: 18 web draw calls, not 169 objects.
bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.join();bpy.context.object.name='Deep Whale Maid - stylized bust prototype'
for o in bpy.context.selected_objects:o['assetLicense']='CC-BY-NC-SA-4.0';o['modelStatus']='prototype-reconstruction';o['version']='0.1.0'
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'deep-whale-maid.glb'),export_format='GLB',export_copyright='CC BY-NC-SA 4.0; character: 上善无形; maid design: ZipZipPipe; reference adaptation: Small-tailqwq; 3D reconstruction: AI Moe Atlas (AI-assisted). Sources and modifications in accompanying NOTICE.txt.',use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_extras=True)
# Reproducible studio views, same model and materials.
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False;scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.62,.73,.83,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.35;scene.view_settings.view_transform='AgX';scene.render.resolution_x=1000;scene.render.resolution_y=1100;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True

def point(o,t):o.rotation_euler=(Vector(t)-o.location).to_track_quat('-Z','Y').to_euler()
for n,loc,power,size in [('Key',(-3,-4,6),520,4),('Fill',(4,-2,3.5),340,3),('Rim',(0,3,5),650,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=n;o.data.energy=power;o.data.shape='DISK';o.data.size=size;point(o,(0,0,1.7))
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=3.85;cam.location=(0,-8,2.15);point(cam,(0,0,1.80))
# On-screen Blender opens with reference and real script execution visible.
for screen in bpy.data.screens:
 for area in screen.areas:
  if area.type=='VIEW_3D':
   area.spaces.active.region_3d.view_distance=5;area.spaces.active.region_3d.view_location=(0,0,1.7);area.spaces.active.region_3d.view_rotation=cam.rotation_euler.to_quaternion();area.spaces.active.shading.type='MATERIAL'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(REVIEW,'deep-whale-maid-v0.1.0.blend'))
if '--render-views' in __import__('sys').argv:
 for n,loc in [('front',(0,-8,2.15)),('three-quarter',(4,-8,2.75)),('side',(8,0,2.15)),('back',(0,8,2.15))]:
  cam.location=loc;point(cam,(0,0,1.80));scene.render.filepath=os.path.join(REVIEW,n+'.png');bpy.ops.render.render(write_still=True)
  if n=='three-quarter':scene.render.filepath=os.path.join(OUT,'poster.png');bpy.ops.render.render(write_still=True)
print('MODEL_EXPORT_COMPLETE',os.path.join(OUT,'deep-whale-maid.glb'))
