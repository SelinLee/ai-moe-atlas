"""Deep Whale Maid v0.4.0, volumetric facial/torso study from authoritative v0.3.

CC BY-NC-SA 4.0. Attribution: 上善无形 → ZipZipPipe → Small-tailqwq;
AI Moe Atlas AI-assisted derivative. Approved imagegen turnaround is an
interpretive modeling reference, not creator-original artwork or calibrated CAD.
Static editable model, no rig. No publication or v0.3 write occurs here.

Start a fresh GUI: blender --factory-startup --python this-file
Or, in a fresh GUI console: exec(compile(open(PATH).read(), PATH, 'exec'), {'__file__': PATH})
The source is appended using libraries.load, avoiding open_mainfile UI resets.
ATLAS_MODEL_SOURCE_BLEND may override the authoritative v0.3 input.
ATLAS_MODEL_REVIEW_DIR overrides the v0.4 review destination.
--render-views renders exact front, side, 45-degree, back and face checks.
--export-glb is opt-in; it joins a temporary export clone, then removes it.
"""
from pathlib import Path
import bpy, bmesh, math, os, sys, json, hashlib
from math import sin, cos, pi, sqrt, exp
from mathutils import Vector

ROOT=Path(__file__).resolve().parents[2]
WORK=ROOT.parent
SOURCE=Path(os.environ.get('ATLAS_MODEL_SOURCE_BLEND',str(WORK/'whale-deliverables/Deep-Whale-Maid-v0.3.0-C-model/deep-whale-maid-v0.3.0.blend')))
REVIEW=Path(os.environ.get('ATLAS_MODEL_REVIEW_DIR',str(WORK/'whale-v04/review')))
REFERENCE=ROOT/'public/models/deep-whale-maid/references/whale-maid-multiview-reference-v2.png'
if not REFERENCE.is_file():REFERENCE=WORK/'whalemaid-reference/output/whale-maid-multiview-reference-v2.png'
VERSION='0.4.0'
if not SOURCE.is_file():raise FileNotFoundError('Authoritative v0.3 source required: '+str(SOURCE))
if SOURCE.resolve()==(REVIEW/f'deep-whale-maid-v{VERSION}.blend').resolve():raise ValueError('Source and destination must differ')
REVIEW.mkdir(parents=True,exist_ok=True)
SOURCE_SHA=hashlib.sha256(SOURCE.read_bytes()).hexdigest()
def stage(message):
 print('V04_STAGE',message,flush=True)
 with (REVIEW/'build-progress.log').open('a') as log:log.write(message+'\n')
stage('0 source verified; beginning isolated rebuild')
# Run in a fresh Blender process if the authoritative file is currently open.
# Appending that same path while deleting its live UI/depsgraph datablocks can
# invalidate long-lived references in some Blender builds.
if bpy.data.filepath and Path(bpy.data.filepath).resolve()==SOURCE.resolve():
 raise RuntimeError('Open a fresh factory-startup Blender process, then run this builder; do not append the currently open source file')
# Append authoritative meshes/materials, never recreate v0.3 from a stale builder.
for ob in list(bpy.data.objects):bpy.data.objects.remove(ob,do_unlink=True)
for col in list(bpy.data.collections):bpy.data.collections.remove(col)
for datablocks in [bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights]:
 for block in list(datablocks):
  if block.users==0:datablocks.remove(block)
scene=bpy.context.scene
parts=bpy.data.collections.new('EDITABLE - Whale Maid v0.4 volumetric parts');scene.collection.children.link(parts)
studio=bpy.data.collections.new('STUDIO - orthographic review');scene.collection.children.link(studio)
stage('1 clean scene; appending authoritative parts')
with bpy.data.libraries.load(str(SOURCE),link=False) as (available,loaded):loaded.objects=list(available.objects)
for ob in loaded.objects:
 if ob is not None:
  (parts if ob.type=='MESH' else studio).objects.link(ob)
  ob.hide_viewport=False;ob.hide_render=False;ob.hide_set(False)
bpy.context.view_layer.update()
stage('2 source parts appended')
assert bpy.data.objects.get('Refined rounded face') and bpy.data.objects.get('Continuous whale tail with broad flukes'),'Unexpected v0.3 source'

def smooth(a,b,x):
 t=max(0.,min(1.,(x-a)/(b-a)));return t*t*(3-2*t)
def mix(a,b,t):return tuple(x*(1-t)+y*t for x,y in zip(a,b))
def chin_local(v):
 x,y,z=v
 if z>=3.320:return (x,y,z)
 knots=[(2.995,3.075),(3.035,3.083),(3.105,3.100),(3.215,3.200),(3.320,3.320)]
 i=next((i for i in range(len(knots)-1) if z<=knots[i+1][0]),len(knots)-2)
 za,va=knots[i];zb,vb=knots[i+1];dt=zb-za;t=max(0,min(1,(z-za)/dt))
 if i==0:ma=.20
 else:ma=(knots[i+1][1]-knots[i-1][1])/(knots[i+1][0]-knots[i-1][0])
 if i==len(knots)-2:mb=1.
 else:mb=(knots[i+2][1]-knots[i][1])/(knots[i+2][0]-knots[i][0])
 nz=(2*t**3-3*t*t+1)*va+(t**3-2*t*t+t)*dt*ma+(-2*t**3+3*t*t)*vb+(t**3-t*t)*dt*mb
 q=max(0,min(1,(z-2.995)/(.325)));front=max(0,min(1,(-y-.02)/.16));front=front*front*(3-2*front)
 retract=.050*math.exp(-(x/.48)**2)*max(0,math.sin(math.pi*q))**2*front
 return (x,y+retract,nz)

def round_jaw_local(v):
 # User-requested rounded bilateral lower-jaw transitions, preserving the
 # shorter central floor, all depth coordinates and upper face exactly.
 x,y,z=v
 if z>=3.32 or abs(x)<=.18:return (x,y,z)
 lift=.066*smooth(.18,.56,abs(x))*(1-smooth(3.10,3.32,z))
 return (x,y,z+lift)

def shorten_lower_chin(v):
 # C2 rounded-linear vertical compaction: derivative spread across 80% of
 # each lower-face interval, with eased 10% shoulders. Not cumulative.
 x,y,z=v
 def ease(t):
  t=max(0.,min(1.,t));return t*t*t*(10+t*(-15+6*t))
 cutoff=3.32+.23*ease((abs(x)-.22)/.46)
 if z>=cutoff:return (x,y,z)
 q=max(0.,min(1.,(z-3.075)/(cutoff-3.075)));a=.10
 if q<a:
  t=q/a;integral=a*(t**3-.5*t**4)
 elif q>1-a:
  t=(1-q)/a;integral=(1-a)-a*(t**3-.5*t**4)
 else:integral=q-.5*a
 return (x,y,z+.075*(1-integral/(1-a)))

def gauss(x,z,cx,cz,wx,wz):return exp(-((x-cx)/wx)**2-((z-cz)/wz)**2)
def material(name,color,rough=.65):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough
 return m
skin=bpy.data.materials['Porcelain skin'];ink=bpy.data.materials['Ink lashes'];hair=bpy.data.materials['Indigo hair'];mouth=bpy.data.materials['Mouth']
# The values are linear, consistent with the v0.3 source palette.
face_mat=material('v0.4 painted porcelain with warm cheek tint',(1,1,1),.66)
eye_mat=material('v0.4 sapphire eye color',(1,1,1),.42)
for m in [face_mat,eye_mat]:
 nt=m.node_tree;vc=nt.nodes.new('ShaderNodeVertexColor');vc.layer_name='Color';nt.links.new(vc.outputs['Color'],nt.nodes['Principled BSDF'].inputs['Base Color'])

def mesh(name,vertices,faces,mat,colors=None):
 data=bpy.data.meshes.new(name);data.from_pydata(vertices,[],faces);data.update()
 ob=bpy.data.objects.new(name,data);parts.objects.link(ob);data.materials.append(mat)
 for p in data.polygons:p.use_smooth=True
 if colors:
  ca=data.color_attributes.new(name='Color',type='FLOAT_COLOR',domain='POINT')
  for i,c in enumerate(colors):ca.data[i].color=(*c,1)
 ob['version']=VERSION;ob['refinedHead']=True;ob['volumetricV04']=True
 return ob

def stroke(name,points,radius,mat):
 d=bpy.data.curves.new(name,'CURVE');d.dimensions='3D';d.resolution_u=12;d.bevel_depth=radius;d.bevel_resolution=3
 s=d.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for p,v in zip(s.bezier_points,points):p.co=v;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
 ob=bpy.data.objects.new(name,d);parts.objects.link(ob);d.materials.append(mat);ob['version']=VERSION;ob['refinedHead']=True;ob['volumetricV04']=True
 return ob

# Remove only the obsolete facial construction. Hair, dress, legs and plump tail
# are preserved from the actual saved source, then locally re-seated below.
remove_prefixes=('Refined rounded face','Left painted anime eye','Right painted anime eye','Tapered upper anime lash','Fine outer eyelash','Quiet lower lash','Soft brow','Subtle button nose','Closed omega smile')
for ob in list(parts.objects):
 if ob.name.startswith(remove_prefixes):bpy.data.objects.remove(ob,do_unlink=True)

# A shaped set of cranium/jaw sections instead of a deeper ellipse. z, width,
# front depth, rear depth. Broad smiling cheeks flow into a compact rounded jaw,
# with a tucked chin and fuller occiput. Ring profiles use C1 cubic interpolation.
HEAD=[(2.995,.035,.072,.065),(3.035,.235,.325,.230),(3.105,.465,.518,.380),
 (3.215,.635,.620,.510),(3.355,.737,.658,.620),(3.500,.777,.663,.692),
 (3.670,.789,.646,.758),(3.840,.776,.648,.789),(4.010,.744,.626,.798),
 (4.180,.657,.574,.748),(4.330,.482,.441,.621),(4.435,.274,.265,.417),(4.492,.010,.012,.015)]

def section(z):
 z=max(HEAD[0][0],min(HEAD[-1][0],z));i=next((i for i in range(len(HEAD)-1) if z<=HEAD[i+1][0]),len(HEAD)-2)
 p0,p1=HEAD[i],HEAD[i+1];dt=p1[0]-p0[0];t=(z-p0[0])/dt
 vals=[]
 for k in (1,2,3):
  a=HEAD[max(0,i-1)];b=HEAD[min(len(HEAD)-1,i+1)];ma=(b[k]-a[k])/(b[0]-a[0])
  a=HEAD[i];b=HEAD[min(len(HEAD)-1,i+2)];mb=(b[k]-a[k])/(b[0]-a[0])
  vals.append(max(.005,(2*t**3-3*t*t+1)*p0[k]+(t**3-2*t*t+t)*dt*ma+(-2*t**3+3*t*t)*p1[k]+(t**3-t*t)*dt*mb))
 return vals

def feature_offset(x,z):
 # Negative values come toward the viewer. These are part of the one skin mesh.
 d=0.
 for sign in (-1,1):
  d+=.036*gauss(x,z,sign*.303,3.705,.216,.205) # shallow eye socket
  d-=.030*gauss(x,z,sign*.345,3.935,.243,.087) # brow cushion
  d-=.051*gauss(x,z,sign*.423,3.460,.212,.132) # lifted smiling cheek
 d-=.021*gauss(x,z,0,3.600,.083,.180) # short bridge to button nose
 d-=.04575*gauss(x,z,0,3.523,.065,.056) # tiny sculpted nose tip
 d-=.015*gauss(x,z,0,3.481,.092,.032) # soft philtrum transition
 d-=.028*gauss(x,z,0,3.352,.172,.102) # restrained muzzle/orbicularis volume
 d-=.018*gauss(x,z,0,3.143,.255,.092) # soft chin pad
 return d

def face_y(x,z):
 width,front,rear=section(z);r=min(.99999,abs(x)/width)
 # Circular side wrap, subtly broader around the lower face, never a flat mask.
 exponent=.88+.14*smooth(3.43,3.94,z)
 y=-front*max(.00001,1-r*r)**(exponent*.5)
 return y+feature_offset(x,z)*max(0,1-r*r)**.5

def nose_lift_delta(x,z):
 # Translate existing tip/philtrum relief locally on the narrowed head.
 # This difference replaces the old relief; it is never an added nose bead.
 ox=x/.92
 def ease(t):
  t=max(0.,min(1.,t));return t*t*t*(10+t*(-15+6*t))
 weight=(1-ease((abs(ox)-.12)/.06))*ease((z-3.39)/.04)*(1-ease((z-3.61)/.05))
 if weight==0:return 0.
 def relief(t):return -.04575*gauss(ox,t,0,3.523,.065,.056)-.015*gauss(ox,t,0,3.481,.092,.032)
 width=section(z)[0];wrap=sqrt(max(0,1-(ox/width)**2))
 return (relief(z-.020)-relief(z))*wrap*weight

def lifted_face_y(x,z):
 return face_y(x/.92,z)+nose_lift_delta(x,z)

def rear_fit_ease(a,b,x):
 t=max(0.,min(1.,(x-a)/(b-a)));return t*t*t*(10+t*(-15+6*t))

def rear_crown_offset(v,name):
 # Final rear-only fit correction. Keep x/z, all face parts and all colors.
 x,y,z=v
 if name=='Smooth indigo scalp':
  w=rear_fit_ease(3.82,3.96,z)*(1-rear_fit_ease(4.34,4.50,z))*(1-rear_fit_ease(.24,.42,abs(x)))*rear_fit_ease(.15,.45,y)
  return .016*exp(-(x/.26)**2-((z-4.19)/.18)**2)*w
 amps={'Layered back sweep 00':.135,'Layered back sweep 01':.115,'Layered back sweep 02':.034,'Layered back sweep 05':.078,'Layered back sweep 06':.103}
 # Shear independent of y preserves tube thickness (Jacobian determinant 1).
 return -amps.get(name,0.)*rear_fit_ease(3.45,3.90,z)

def spread_eye_assembly(ob,sign,offset=.020):
 # World-space lateral translation with unchanged x/z shape and vertex colors.
 # Re-seat only y against the unchanged narrowed head. Eyebrows stay fixed.
 mx=ob.matrix_world
 assert all(abs(mx[i][j]-(1. if i==j else 0.))<1e-8 for i in range(3) for j in range(3))
 for v in ob.data.vertices:
  wx=v.co.x+mx[0][3];wz=v.co.z+mx[2][3];nx=wx+sign*offset
  v.co.x=nx-mx[0][3]
  v.co.y+=face_y(nx/.92,wz)-face_y(wx/.92,wz)
 ob.data.update()

def extend_omega_centerline(ob,width_factor=1.18):
 # Spread centerline samples, not the tube cross-sections. Keep every sample z
 # and omega amplitude; rotate circular sections onto the new seated tangent.
 old=[v.co.copy() for v in ob.data.vertices];ring_size=10
 assert len(old)%ring_size==0
 centers=[sum(old[i:i+ring_size],Vector((0,0,0)))/ring_size for i in range(0,len(old),ring_size)]
 new=[Vector((c.x*width_factor,c.y+lifted_face_y(c.x*width_factor,c.z)-lifted_face_y(c.x,c.z),c.z)) for c in centers]
 for i,(c,nc) in enumerate(zip(centers,new)):
  ia=max(0,i-1);ib=min(len(centers)-1,i+1)
  rotation=(centers[ib]-centers[ia]).normalized().rotation_difference((new[ib]-new[ia]).normalized())
  for j in range(ring_size):ob.data.vertices[i*ring_size+j].co=nc+rotation@(old[i*ring_size+j]-c)
 ob.data.update()

def skin_color(x,z,y):
 tint=0.
 if y<0:
  for s in (-1,1):tint+=.40*gauss(x,z,s*.474,3.438,.177,.091)
  tint+=.065*gauss(x,z,0,3.516,.055,.054)
 return mix((.98,.69,.59),(.985,.37,.405),min(.46,tint))

vs=[];fs=[];cols=[];R=104;S=160
for i in range(R+1):
 z=HEAD[0][0]+(HEAD[-1][0]-HEAD[0][0])*i/R;w,f,b=section(z)
 for j in range(S):
  a=2*pi*j/S;x=w*sin(a)
  y=face_y(x,z) if cos(a)>=0 else b*(-cos(a))
  vs.append(shorten_lower_chin(round_jaw_local(chin_local((x,y,z)))));cols.append(skin_color(x,z,y))
for i in range(R):
 for j in range(S):a=i*S+j;c=i*S+(j+1)%S;fs.append((a,c,c+S,a+S))
fs.extend([tuple(range(S-1,-1,-1)),tuple(R*S+j for j in range(S))])
face=mesh('V04 integrated cranium cheeks muzzle jaw',vs,fs,face_mat,cols)
face['construction']='C1 section-shaped skull; integrated socket, brow, cheek, nose, muzzle, chin and jaw transitions'
face['faceVariant']='C cute round-eyed, volumetric refinement'

stage('3 section-shaped facial shell complete')
# Eyes follow the local orbital surface; a shallow eye cap and skin eyelid blend
# into it. The cap is intentionally low-relief, with no round disc stacking.
ECX=.305;ECZ=3.708;EW=.234

def eye_bounds(u,sign):
 h=max(0.,1-u*u)**.40;upper_h=max(0.,1-u*u)**.50;tilt=.034*u
 return (-.149*h+tilt,.181*upper_h+tilt+(.004 if sign<0 else 0)*upper_h)

def eye_surface(x,z,u,q):
 return face_y(x,z)-.003-.0045*(max(0,1-u*u))*sin(pi*q)

def iris_local(dx,dz,sign=0):
 # Physical x/z coordinates after the .92 facial-width refit. Both upper
 # axes lean 4 degrees screen-right, a subtle reference interpretation.
 # The reference does not establish a calibrated mirrored inward pair.
 x=.92*(dx+sign*.030+.002);z=dz-.008;theta=-4*pi/180
 return cos(theta)*x+sin(theta)*z,-sin(theta)*x+cos(theta)*z

def eye_color(dx,dz,sign=0):
 # Color-only iris revision: broader ellipse with shared directional tilt.
 # The cap, white opening, eyelids and eyelashes keep their exact geometry.
 u,v=iris_local(dx,dz,sign)
 sclera=(.985,.965,.944);rad=sqrt((u/(.163*.92))**2+(v/.194)**2)
 if rad>1.035:return sclera
 t=smooth(-.145,.090,dz)
 col=mix((.160,.650,1.000),(.015,.045,.220),t)
 col=mix(col,(.010,.038,.145),.70*smooth(.86,1.02,rad))
 # The small pupil rotates rigidly with the iris; its physical radii stay
 # .03404/.065, so a wider iris does not enlarge the black pupil.
 pupil=sqrt((u/(.037*.92))**2+((v-.027)/.065)**2)
 col=mix(col,(.006,.014,.040),.98*(1-smooth(.86,1.04,pupil)))
 halo=exp(-((rad-.75)/.13)**2)*(1-smooth(-.04,.025,dz))*.30
 col=mix(col,(.40,.85,1.00),halo)
 # Shared light source: catchlights remain upper-left in BOTH eyes.
 # Do not mirror/rotate their centers with the different iris-side labels.
 sx=dx+sign*.030
 for hx,hz,rx,rz,alpha in [(-.052,.104,.031,.039,1),(.058,-.080,.020,.023,.94),(-.047,-.059,.010,.021,.50)]:
  d=sqrt(((sx-hx)/rx)**2+((dz-hz)/rz)**2);col=mix(col,(1,1,1),alpha*(1-smooth(.83,1.08,d)))
 return mix(sclera,col,1-smooth(.985,1.035,rad))

for sign in (-1,1):
 side='Left' if sign<0 else 'Right';cx=sign*ECX;cz=ECZ;vs=[];fs=[];cols=[];A=100;B=68
 for i in range(A+1):
  u=-1+2*i/A;lo,hi=eye_bounds(u,sign)
  for j in range(B+1):
   q=j/B;dx=EW*u;dz=lo*(1-q)+hi*q;x=cx+sign*dx;z=cz+dz
   vs.append((x,eye_surface(x,z,u,q),z));cols.append(eye_color(sign*dx,dz,sign))
 for i in range(A):
  for j in range(B):a=i*(B+1)+j;fs.append((a,a+1,a+B+2,a+B+1))
 eye=mesh(side+' V04 orbital eye cap',vs,fs,eye_mat,cols);eye['facePatch']=True
 for upper in (True,False):
  vs=[];fs=[];cols=[];N=100;K=6
  for i in range(N+1):
   u=-1+2*i/N;lo,hi=eye_bounds(u,sign);basez=cz+(hi if upper else lo);x=cx+sign*EW*u
   fade=max(0,1-u*u)**.45;spread=(.045 if upper else .024)*fade
   for j in range(K+1):
    t=j/K;z=basez+(1 if upper else -1)*spread*t
    # Raised soft lid edge resolves back into one coherent skin surface.
    edge,bend=(.007,.004) if upper else (.0035,.002)
    y=face_y(x,z)-.0015-(edge*(1-t)**2+bend*sin(pi*t))*fade
    vs.append((x,y,z));cols.append(skin_color(x,z,y))
  for i in range(N):
   for j in range(K):a=i*(K+1)+j;fs.append((a,a+1,a+K+2,a+K+1))
  ob=mesh(side+(' V04 soft upper eyelid' if upper else ' V04 soft lower eyelid'),vs,fs,face_mat,cols);ob['facePatch']=True
 # A sculpted tapered upper lash ribbon follows the wrapped upper lid.
 vs=[];fs=[];N=100
 for i in range(N+1):
  u=-1+2*i/N;lo,hi=eye_bounds(u,sign);x=cx+sign*EW*u;z=cz+hi
  width=(.007+.035*max(0,1-u*u)**.6+.010*smooth(0,1,u))*smooth(-1,-.85,u)
  for zz in (z-.002,z+width):vs.append((x,face_y(x,zz)-.011,zz))
 for i in range(N):a=2*i;fs.append((a,a+1,a+3,a+2))
 ob=mesh(side+' V04 shaped upper lash',vs,fs,ink);ob['facePatch']=True
 # Two genuine tapered outward lashes, continuous with the raised outer corner.
 for j in range(2):
  u=.77-j*.18;lo,hi=eye_bounds(u,sign);x=cx+sign*EW*u;z=cz+hi+.010
  tipx=x+sign*1.20*(.053-j*.009);tipz=z+1.20*(.044-j*.010)
  verts=[(x-sign*.018,face_y(x-sign*.018,z)-.012,z),(x+sign*.016,face_y(x+sign*.016,z+.014)-.013,z+.014),(tipx,face_y(tipx,tipz)-.009,tipz)]
  lash=mesh(side+' V04 tapered outer lash '+str(j+1),verts,[(0,1,2)],ink);lash.modifiers.new('Fine lash thickness','SOLIDIFY').thickness=.006;lash['facePatch']=True
 # Lower liner stops short of the inner corner, avoiding an outlined eye disc.
 points=[]
 for i in range(26):
  u=-.20+1.17*i/25;lo,hi=eye_bounds(u,sign);x=cx+sign*EW*u;z=cz+lo;points.append((x,face_y(x,z)-.007,z))
 stroke(side+' V04 quiet outer lower liner',points,.0032,ink)
 # Lifted brow, with a gentle inward dip; broad ribbon instead of a tube.
 vs=[];fs=[]
 for i in range(45):
  t=i/44;x=cx+sign*(-.131+.274*t);z=3.970+.030*sin(pi*t)+.022*t
  thickness=.012*sin(pi*t)**.6+.003
  for dz in (-thickness/2,thickness/2):vs.append((x,face_y(x,z+dz)-.007,z+dz))
 for i in range(44):a=2*i;fs.append((a,a+1,a+3,a+2))
 brow=mesh(side+' V04 expressive soft brow',vs,fs,hair);brow['facePatch']=True

# Closed omega mouth rests on the low, integrated smiling muzzle. No separate
# floating button nose: the tip and bridge above are sculpted into the skin.
smile=[(-.077,3.371),(-.053,3.351),(-.025,3.352),(0,3.365),(.025,3.352),(.053,3.351),(.077,3.371)]
stroke('V04 closed omega smile',[(x*1.20,lifted_face_y(x*1.20,z+.020)-.005,z+.020) for x,z in smile],.0055,mouth)
# Almost imperceptible lower-lip cushion, colored as skin rather than lipstick.
vs=[];fs=[];cols=[]
for i in range(49):
 x=(-.075+.15*i/48)*1.20;fade=max(0,1-(x/.090)**2)
 for j in range(9):
  t=j/8;z=3.353+.025*t;y=lifted_face_y(x,z)-.002-.004*sin(pi*t)*fade
  vs.append((x,y,z));cols.append(skin_color(x/.92,z,y))
for i in range(48):
 for j in range(8):a=i*9+j;fs.append((a,a+1,a+10,a+9))
lip=mesh('V04 soft lower lip transition',vs,fs,face_mat,cols);lip['facePatch']=True

stage('4 orbital eye/lid/lash construction complete')
# Re-seat the original saved hair around the newly full skull. Front locks follow
# a backward-sweeping root trajectory instead of forming flat hanging plates.
def change_world_vertices(ob,fn):
 matrix=ob.matrix_world.copy();inv=matrix.inverted()
 for v in ob.data.vertices:v.co=inv@Vector(fn(matrix@v.co))
 ob.data.update()

def hair_warp(v,name):
 x,y,z=v
 if name.startswith('Smooth indigo scalp'):
  y=.043+(y-.043)*1.43
 elif name.startswith(('Center swept fringe','Parted swept bang')):
  z-=.105*smooth(4.18,4.62,z)
  depth=.043+(y-.043)*1.39
  q=max(.01,1-(x/.86)**2-((z-3.78)/.84)**2)
  scalp_front=.043-.805*sqrt(q)-.033
  blend=.86*smooth(4.11,4.55,z)
  y=depth*(1-blend)+scalp_front*blend
 elif name.startswith(('Outer cheek framing sweep','Fine outer cheek point')):
  y=.030+(y-.030)*1.35
  # Inner upper contour follows the fuller brow without hiding the eye field.
  y-=.012*gauss(x,z,0,3.87,.7,.35)
 elif name.startswith(('Layered back sweep','Back wispy split','Continuous layered hair undercoat')):
  y+=.20*smooth(.0,.60,y)*smooth(2.05,3.65,z)
 elif name.startswith('Swept side curtain'):
  y+=.125*smooth(2.1,3.7,z)
 elif name.startswith(('Blue cheek curl','Face wispy tip')):
  y-=.07*smooth(2.4,3.5,z)
 elif name.startswith(('Thin whale fin ear','Feather-light fin underside','Side ribbon')):
  y+=.02
 return (x,y,z)

for ob in list(parts.objects):
 if ob.type=='MESH' and ob.get('refinedHead') and not ob.get('volumetricV04'):
  change_world_vertices(ob,lambda v,n=ob.name:hair_warp(v,n));ob['v04HairReseated']=True
# Bodice, torso, sleeves and cloth expand coherently with height-dependent depth;
# the waist stays pinched, chest and upper back are independently rounded.
exclude=('Continuous whale tail','Oval display plinth','Plinth rim','Left ivory stocking','Right ivory stocking','Stocking','Mary Jane','Polished navy','Shoe','Short shoe')
def body_warp(v):
 x,y,z=v
 if z<1.2:return (x,y,z)
 strength=smooth(1.16,1.42,z)
 factor=1+.18*strength+.10*exp(-((z-2.68)/.30)**2)
 yn=.025+(y-.025)*factor
 if y<-.14:yn-=.023*gauss(x,z,0,2.655,.43,.22)*smooth(-.12,-.33,y)
 if y>.13:yn+=.024*gauss(x,z,0,2.66,.44,.25)
 return (x,yn,z)
for ob in list(parts.objects):
 if ob.type=='MESH' and not ob.get('refinedHead') and not ob.name.startswith(exclude):
  change_world_vertices(ob,body_warp);ob['v04TorsoDepth']=True
# Final support-fit corrections: same function is used by the recorded GUI
# checkpoint patch so a clean rebuild preserves the reviewed result.
def support_fit(v,name):
 x,y,z=v
 if name.startswith(('Outer cheek framing sweep','Fine outer cheek point')):
  y+=.185*smooth(.45,.68,abs(x))*exp(-((z-3.76)/.40)**2)
 if name.startswith(('Layered back sweep','Continuous layered hair undercoat')):
  t=smooth(4.08,4.43,z)
  d=Vector((x/.846,(y-.043)/.805,(z-3.78)/.82));r=d.length
  if r>1.005:
   k=1+(1.005/r-1)*t;x*=k;y=.043+(y-.043)*k;z=3.78+(z-3.78)*k
 if name.startswith(('Layered back sweep','Back wispy split','Swept side curtain')):
  suffix=name.split()[-1];phase=float(suffix)*.77 if suffix.isdigit() else sum(ord(c) for c in name)*.013
  w=(1-smooth(3.80,4.27,z))*smooth(1.78,2.20,z)
  y+=.060*sin((4.20-z)*5.6+phase)*w;x+=.039*sin((4.20-z)*6.2+phase*.7)*w
 if name.startswith(('Fine white headband','Continuous fine maid lace')):
  x*=.966;z=3.82+(z-3.82)*.939
 if name.startswith('Side ribbon'):
  x-=.075;y+=.153
 if name.startswith('Neck ribbon'):y+=.036
 if name.startswith('Neck blue diamond'):y+=.057
 return (x,y,z)
for ob in list(parts.objects):
 if ob.type=='MESH' and not ob.get('volumetricV04'):
  change_world_vertices(ob,lambda v,n=ob.name:support_fit(v,n))
scene['v04FitPatch']=1
scene['v04FinalExpression']=1
scene['v04ChinRevision']=1
scene['v04ChinFalloffC1']=True
scene['v04RoundedJaw']=1
scene['v04ScleraMatch']=1
scene['v04ShorterChin']=1
scene['v04LowerFaceBroadFalloff']=True
scene['roundedJawRevision']='Bilateral C1 corner lift, central floor and all x/y coordinates retained; upper face z>=3.32 unchanged'
# Short neck seats further back under the tucked chin, with no hard jaw seam.
neck=bpy.data.objects.get('Neck')
if neck:
 neck.location.y+=.045;neck['v04NeckSeated']=True

stage('5 hair and garment depth corrections complete')
# Named parts remain independently editable. Curves become separate meshes for
# predictable export; no persistent clone or destructive web simplification.
bpy.ops.object.select_all(action='DESELECT')
for ob in parts.objects:ob.select_set(True)
bpy.context.view_layer.objects.active=face
bpy.ops.object.convert(target='MESH')
for ob in parts.objects:
 if ob.type!='MESH':continue
 for mod in list(ob.modifiers):
  bpy.context.view_layer.objects.active=ob
  try:bpy.ops.object.modifier_apply(modifier=mod.name)
  except RuntimeError:pass
 bm=bmesh.new();bm.from_mesh(ob.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
 if all(e.is_manifold for e in bm.edges):
  if bm.calc_volume(signed=True)<0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 elif ob.get('facePatch') and sum(f.normal.y*f.calc_area() for f in bm.faces)>0:bmesh.ops.reverse_faces(bm,faces=list(bm.faces))
 bm.to_mesh(ob.data);bm.free();ob.data.update()
 ob['assetLicense']='CC-BY-NC-SA-4.0';ob['attribution']='上善无形 → ZipZipPipe → Small-tailqwq; AI Moe Atlas AI-assisted derivative'
 ob['version']=VERSION;ob['rigged']=False
 ob.select_set(False)
# Narrow only the head/facial frame laterally; profile and short jaw z stay exact.
# The mouth/lower lip stay untouched. Hair contracts coherently at its roots,
# with the adjustment fading out above the shoulders.
for ob in parts.objects:
 if ob.type!='MESH' or not ob.get('refinedHead'):continue
 if ob.name in ('V04 closed omega smile','V04 soft lower lip transition'):continue
 mx=ob.matrix_world;is_hair=not ob.get('volumetricV04')
 assert all(abs(mx[i][j]-(1. if i==j else 0.))<1e-8 for i in range(3) for j in range(3))
 for v in ob.data.vertices:
  wx=v.co.x+mx[0][3];wz=v.co.z+mx[2][3]
  factor=1-.08*(smooth(2.65,3.30,wz) if is_hair else 1.)
  v.co.x=wx*factor-mx[0][3]
 ob.data.update()
for v in face.data.vertices:
 if v.co.y<0:v.co.y+=nose_lift_delta(v.co.x,v.co.z)
face.data.update()
extend_omega_centerline(bpy.data.objects['V04 closed omega smile'],1.18)
for sign in (-1,1):
 side='Left' if sign<0 else 'Right'
 for suffix in [' V04 orbital eye cap',' V04 soft upper eyelid',' V04 soft lower eyelid',' V04 shaped upper lash',' V04 tapered outer lash 1',' V04 tapered outer lash 2',' V04 quiet outer lower liner']:
  spread_eye_assembly(bpy.data.objects[side+suffix],sign,.038)
for ob in parts.objects:
 if ob.name=='Smooth indigo scalp' or ob.name in {'Layered back sweep 00','Layered back sweep 01','Layered back sweep 02','Layered back sweep 05','Layered back sweep 06'}:
  mx=ob.matrix_world
  for v in ob.data.vertices:
   p=mx@v.co;v.co.y+=rear_crown_offset(p,ob.name)
  ob.data.update()
scene['v04RearCrownFit']=1
scene['rearCrownFitRevision']='Rear scalp skin-penetration cover, max +.016y; five existing back-lock roots tucked with y-independent C2 shear; face/colors/xz unchanged'
scene['v04WiderEyeSpacing']=1
scene['v04EvenWiderEyeSpacing']=1
scene['evenWiderEyeSpacingRevision']='Additional .018 per side outward; cumulative .038 each; whole eye/lid/lash assemblies seated to unchanged head, brows and all paint preserved'
scene['widerEyeSpacingRevision']='Whole eye/lid/lash assemblies outward .020 per side, seated along unchanged head; brows and all iris/pupil vertex colors retained'
scene['v04LongerSmileOnly']=1
scene['v04SkyEyesLongerSmile']=1
scene['v04TiltedGradientIris']=1
scene['tiltedGradientIrisRevision']='Iris-only color: width +12.41%; shared interpretive 4deg screen-right upper-axis lean; deep-to-light blue; pupil principal radii retained'
scene['v04LiftedNoseSmile']=1
scene['v04UprightIrisNarrowFace']=1
bpy.context.view_layer.objects.active=face
scene['version']=VERSION;scene['sourceBlendSHA256']=SOURCE_SHA;scene['approvedReference']='https://github.com/SelinLee/ai-moe-atlas/blob/28b2101e56f967ffa94af7de3ebfad2fa733a069/public/models/deep-whale-maid/references/whale-maid-multiview-reference-v2.png'
scene['inferredDetails']='Side/back/hidden volumes, legs, shoes and facial three-dimensional transitions are interpretations'
scene['assetLicense']='CC-BY-NC-SA-4.0';scene['reviewStatus']='Geometry checkpoint; front, exact side and exact 45-degree review required'
scene['methodology']='Section-shaped cranium and jaw with integrated face forms; shallow orbital caps; re-seated hair; height-dependent bodice/cloth depth'

stage('6 normals and separate editable parts finalized')
# Pack the approved multiview as a hidden editable reference. It is not rendered.
if REFERENCE.is_file():
 refs=bpy.data.collections.new('REFERENCE - approved interpretive turnaround');scene.collection.children.link(refs)
 im=bpy.data.images.load(str(REFERENCE),check_existing=True);im.pack()
 ref=bpy.data.objects.new('Approved multiview reference - interpretation, not calibrated',None);ref.empty_display_type='IMAGE';ref.data=im;ref.empty_display_size=5
 refs.objects.link(ref);ref.hide_render=True;refs.hide_render=True;refs.hide_viewport=True

scene.render.engine='CYCLES';scene.cycles.samples=int(os.environ.get('ATLAS_QA_SAMPLES','80'));scene.cycles.use_denoising=False
scene.render.resolution_x=1100;scene.render.resolution_y=1300;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=True
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
if scene.world is None:scene.world=bpy.data.worlds.new('Whale review world')
scene.world.use_nodes=True;scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.62,.73,.83,1);scene.world.node_tree.nodes['Background'].inputs[1].default_value=.38
cam=next(ob for ob in studio.objects if ob.type=='CAMERA');scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=5.82

def point(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
def set_view(name='front'):
 center=(.42,0,2.58);views={'front':((.42,-12,2.58),center),'side':((12,0,2.58),(0,0,2.58)),'three-quarter':((8.485,-8.485,2.58),(0,0,2.58)),'back':((.42,12,2.58),center)}
 loc,target=views[name];cam.location=loc;point(cam,target);cam.data.ortho_scale=5.82
set_view()

# Delayed UI setup: changing editor type creates region_3d only after redraw.
DEST=REVIEW/f'deep-whale-maid-v{VERSION}.blend'
def prepare_viewports():
 for screen in bpy.data.screens:
  for area in screen.areas:
   if area.type in ('VIEW_3D','CONSOLE'):
    area.type='VIEW_3D';space=area.spaces.active
    if space.type!='VIEW_3D':continue
    space.overlay.show_overlays=False;space.shading.type='MATERIAL'
    if space.region_3d:
     space.region_3d.view_distance=7.35;space.region_3d.view_location=(.35,0,2.58);space.region_3d.view_rotation=cam.rotation_euler.to_quaternion()
def save_ready():
 prepare_viewports();bpy.ops.wm.save_as_mainfile(filepath=str(DEST),compress=True);return None
stage('7 saving compressed v0.4 checkpoint')
bpy.ops.wm.save_as_mainfile(filepath=str(DEST),compress=True)
if bpy.app.background:save_ready()
else:
 prepare_viewports();bpy.app.timers.register(save_ready,first_interval=.6)

measurements={}
for name in ['V04 integrated cranium cheeks muzzle jaw','Smooth indigo scalp','Fitted midnight maid bodice','Sixteen-fold bell skirt','Continuous whale tail with broad flukes']:
 ob=bpy.data.objects.get(name);xyz=[ob.matrix_world@v.co for v in ob.data.vertices]
 measurements[name]={'min':[min(v[k] for v in xyz) for k in range(3)],'max':[max(v[k] for v in xyz) for k in range(3)],'vertices':len(xyz)}
(REVIEW/'v04-geometry-checkpoint.json').write_text(json.dumps({'version':VERSION,'authoritativeSourceSHA256':SOURCE_SHA,'reference':'https://github.com/SelinLee/ai-moe-atlas/blob/28b2101e56f967ffa94af7de3ebfad2fa733a069/public/models/deep-whale-maid/references/whale-maid-multiview-reference-v2.png','measurements':measurements,'parts':len(parts.objects),'renderProjection':'orthographic; exact 0, 45, 90 degrees; no camera pitch','samples':scene.cycles.samples,'denoising':False},ensure_ascii=False,indent=2))

def clean_glb_endpoints(path):
 import struct,hashlib,numpy as np
 path=Path(path);original=path.read_bytes();magic,version,total=struct.unpack_from('<III',original,0)
 assert magic==0x46546c67 and version==2
 jl,jt=struct.unpack_from('<II',original,12);assert jt==0x4e4f534a
 g=json.loads(original[20:20+jl]);bo=20+jl;bl,bt=struct.unpack_from('<II',original,bo);assert bt==0x004e4942
 binary=bytearray(original[bo+8:bo+8+bl]);details=[]
 def accessor(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];dims={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']]
  dtype=np.dtype({5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[a['componentType']]);offset=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',dtype.itemsize*dims)
  return np.ndarray((a['count'],dims),dtype=dtype,buffer=binary,offset=offset,strides=(stride,dtype.itemsize))
 def attribute_digest():
  h=hashlib.sha256()
  for m in g.get('meshes',[]):
   for p in m['primitives']:
    for name,i in sorted(p['attributes'].items()):h.update(name.encode());h.update(accessor(i).tobytes())
  return h.hexdigest()
 before=attribute_digest()
 for m in g.get('meshes',[]):
  for p in m['primitives']:
   if p.get('mode',4)!=4 or 'indices' not in p:continue
   pos=accessor(p['attributes']['POSITION']);idx=accessor(p['indices']);tri=idx.reshape(-1,3);co=pos[tri]
   coincident=np.all(co[:,0]==co[:,1],axis=1)|np.all(co[:,1]==co[:,2],axis=1)|np.all(co[:,2]==co[:,0],axis=1)
   count=int(coincident.sum())
   if not count:continue
   kept=tri[~coincident].reshape(-1).copy();idx.reshape(-1)[:len(kept)]=kept
   a=g['accessors'][p['indices']];a['count']=len(kept)
   if 'min' in a:a['min']=[int(kept.min())]
   if 'max' in a:a['max']=[int(kept.max())]
   details.append({'material':g['materials'][p['material']]['name'],'removedZeroAreaTriangles':count})
 after=attribute_digest();assert before==after
 j=json.dumps(g,ensure_ascii=False,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
 out=struct.pack('<III',magic,version,12+8+len(j)+8+len(binary))+struct.pack('<II',len(j),jt)+j+struct.pack('<II',len(binary),bt)+binary
 path.write_bytes(out)
 return {'removedZeroAreaTriangles':sum(x['removedZeroAreaTriangles'] for x in details),'details':details,'allVertexAttributesUnchanged':before==after,'vertexAttributeSHA256':after,'beforeFileSHA256':hashlib.sha256(original).hexdigest(),'afterFileSHA256':hashlib.sha256(out).hexdigest()}

if '--export-glb' in sys.argv:
 # Web export combines material groups to avoid roughly 185 per-part draw calls.
 # The clone is temporary and is never included in the editable source save.
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts.objects:ob.select_set(True)
 bpy.context.view_layer.objects.active=face;bpy.ops.object.duplicate()
 clones=list(bpy.context.selected_objects);bpy.context.view_layer.objects.active=clones[0]
 bpy.ops.object.join();web=bpy.context.object;web.name='Deep Whale Maid - static v0.4.0'
 web['version']=VERSION;web['rigged']=False;web['assetLicense']='CC-BY-NC-SA-4.0'
 web['attribution']='上善无形 → ZipZipPipe → Small-tailqwq; AI Moe Atlas AI-assisted derivative'
 web['faceVariant']='C cute round-eyed, volumetric refinement'
 try:
  bpy.ops.export_scene.gltf(filepath=str(REVIEW/'deep-whale-maid-v0.4.0.glb'),export_format='GLB',use_selection=True,export_yup=True,export_apply=True,export_texcoords=False,export_extras=True,export_copyright='CC BY-NC-SA 4.0; 上善无形 → ZipZipPipe → Small-tailqwq; AI Moe Atlas AI-assisted derivative. Inferred side/back/hidden geometry. Static, unrigged.')
  clean_glb_endpoints(REVIEW/'deep-whale-maid-v0.4.0.glb')
 finally:
  data=web.data;bpy.data.objects.remove(web,do_unlink=True)
  if data.users==0:bpy.data.meshes.remove(data)
  bpy.context.view_layer.objects.active=face
 for ob in parts.objects:ob.select_set(False)
if '--render-views' in sys.argv:
 for name in ['front','side','three-quarter','back']:
  set_view(name);scene.render.filepath=str(REVIEW/(name+'.png'));bpy.ops.render.render(write_still=True)
 for name,loc in [('face-front',(0,-12,3.86)),('face-side',(12,0,3.86)),('face-three-quarter',(8.485,-8.485,3.86))]:
  cam.location=loc;point(cam,(0,0,3.86));cam.data.ortho_scale=2.75
  scene.render.filepath=str(REVIEW/(name+'.png'));bpy.ops.render.render(write_still=True)
 set_view();bpy.ops.wm.save_as_mainfile(filepath=str(DEST),compress=True)
print('V04_VOLUME_CHECKPOINT_READY',str(DEST),'source hash',SOURCE_SHA)
