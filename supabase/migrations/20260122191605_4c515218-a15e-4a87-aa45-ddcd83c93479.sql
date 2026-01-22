-- Restore proper RLS policies that use auth.uid()

-- First drop the permissive policies we just created
DROP POLICY IF EXISTS "Allow profile insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile update by id" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile select" ON public.profiles;
DROP POLICY IF EXISTS "Allow welder profile operations" ON public.welder_profiles;
DROP POLICY IF EXISTS "Allow employer profile operations" ON public.employer_profiles;

-- Restore proper profiles policies
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Restore proper welder_profiles policies
CREATE POLICY "Welders can insert own profile" 
ON public.welder_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Welders can manage own profile" 
ON public.welder_profiles 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Employers can view welder profiles" 
ON public.welder_profiles 
FOR SELECT 
USING (public.get_user_type(auth.uid()) = 'employer'::user_type);

-- Restore proper employer_profiles policies
CREATE POLICY "Employers can insert own profile" 
ON public.employer_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Employers can manage own profile" 
ON public.employer_profiles 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Anyone can view employer profiles" 
ON public.employer_profiles 
FOR SELECT 
USING (true);

-- Create trigger to handle new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();