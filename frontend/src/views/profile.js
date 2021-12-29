import React, { useState, useEffect, useRef } from "react";

import { useAuth0 } from "@auth0/auth0-react";
import { Auth0Client } from "@auth0/auth0-spa-js";

const domain = "dev-wcwybeid.us.auth0.com";
const client_id = process.env.REACT_APP_AUTH0_CLIENT_ID;

const Profile = () => {
  const { user, getAccessTokenSilently } = useAuth0();
  const [userMetadata, setUserMetadata] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState(null);

  const formRef = useRef();

  const authenticateUser = async () => {
    const auth0 = new Auth0Client({
      domain,
      client_id,
    });
    await auth0.loginWithPopup({
      max_age: 0,
      scope: "openid",
    });
    console.log(auth0.getIdTokenClaims().then((claim) => console.log(claim)));
    return await auth0.getIdTokenClaims();
  };

  const { name, picture, email, sub } = user;

  //Fetch user_metadata
  useEffect(() => {
    const getUserMetadata = async () => {
      try {
        const accessToken = await getAccessTokenSilently({
          scope: "read:current_user",
        });

        const userDetailsByIdUrl = `https://${domain}/api/v2/users/${sub}`;

        const metadataResponse = await fetch(userDetailsByIdUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        const user = await metadataResponse.json();
        console.log({ user });

        setUserMetadata(user.user_metadata);
        setLinkedAccounts(user.identities);
      } catch (e) {
        console.log(e.message);
      }
    };

    getUserMetadata();
  }, [getAccessTokenSilently, sub]);

  //Update user_metadata
  const updateUserMetadata = async (e) => {
    e.preventDefault();
    const { metadata } = formRef.current;

    try {
      setSubmitting(true);
      const accessToken = await getAccessTokenSilently({
        scope: "update:current_user_metadata",
        ignoreCache: true,
      });

      const userDetailsByIdUrl = `https://${domain}/api/v2/users/${user.sub}`;

      const { user_metadata } = await (
        await fetch(userDetailsByIdUrl, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_metadata: { formMetadata: metadata.value },
          }),
        })
      ).json();

      setUserMetadata(user_metadata);
      formRef.current.reset();
    } catch (e) {
      console.log(e.message);
      setSubmitting(false);
    } finally {
      setSubmitting(false);
    }
  };

  const linkAccount = async () => {
    try {
      const accessToken = await getAccessTokenSilently({
        scope: "update:current_user_identities",
      });

      const URL = `https://${domain}/api/v2/users/${user.sub}/identities`;

      const { __raw } = await authenticateUser();

      const response = await (
        await fetch(URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            link_with: __raw,
          }),
        })
      ).json();

      console.log({ response });
      setLinkedAccounts(response);
    } catch (e) {
      console.log(e.message);
    }
  };

  const unlinkAccount = async (sub, provider, user_id) => {
    console.log({ sub, provider, user_id });
    const URL = `https://${domain}/api/v2/users/${sub}/identities/${provider}/${user_id}`;

    try {
      const accessToken = await getAccessTokenSilently({
        scope: "update:users",
      });
      console.log({ accessToken });

      const unlinkedAccountResponse = await (
        await fetch(URL, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: sub,
            provider,
            user_id,
          }),
        })
      ).json();
      console.log({ unlinkedAccountResponse });
      setLinkedAccounts(unlinkedAccountResponse.slice(1));
    } catch (e) {
      console.log(e.message);
    }
  };

  return (
    <div>
      <div className="row align-items-center profile-header">
        <div className="col-md-2 mb-3">
          <img
            src={picture}
            alt="Profile"
            className="rounded-circle img-fluid profile-picture mb-3 mb-md-0"
          />
        </div>
        <div className="col-md text-center text-md-left">
          <h2>{name}</h2>
          <p className="lead text-muted">{email}</p>
        </div>
      </div>
      <div className="row">
        <h2>User Details</h2>
        <pre className="col-12 text-light bg-dark p-4">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      {userMetadata ? (
        <div className="row">
          <h2>User Metadata</h2>
          <pre className="col-12 text-light bg-dark p-4">
            {JSON.stringify(userMetadata, null, 2)}
          </pre>
        </div>
      ) : (
        "This user has no metadata"
      )}
      <form onSubmit={updateUserMetadata} ref={formRef}>
        <label>
          <span>New metadata</span>
          <input type="text" name="metadata" />
        </label>
        <button type="submit" disabled={submitting}>
          Update Metadata
        </button>
      </form>

      <div>
        <div className="row">
          <h2>Linked Accounts</h2>
          <pre className="col-12 text-light bg-dark p-4">
            {linkedAccounts
              ? linkedAccounts.slice(1).map(({ profileData, ...restProps }) => {
                  const { email, name } = profileData;
                  const { connection, provider, user_id } = restProps;
                  return (
                    <div
                      className="d-flex flex-row align-items-center justify-content-between"
                      key={user_id}>
                      <div>
                        <h3>Account</h3>
                        <p>Email: {email}</p>
                        <p>Name: {name}</p>
                        <p>Connection: {connection}</p>
                        <p>Provider: {provider}</p>
                      </div>
                      <button
                        className="btn btn-danger"
                        onClick={() => unlinkAccount(sub, provider, user_id)}>
                        Unlink account
                      </button>
                    </div>
                  );
                })
              : "No linked accounts yet"}
          </pre>
          <button className="btn btn-primary" onClick={linkAccount}>
            Link an account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
